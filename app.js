(() => {
  const MAX_ATTEMPTS = 6;
  const OUT_OF_SCOPE = new Set([
    "北京",
    "上海",
    "天津",
    "重庆",
    "香港",
    "澳门",
    "台北",
    "新北",
    "桃园",
    "台中",
    "台南",
    "高雄",
  ]);
  const ZOOM_STEPS = [
    { label: "街区", spanKm: 16 },
    { label: "城区", spanKm: 64 },
    { label: "都市圈", spanKm: 256 },
    { label: "区域", spanKm: 512 },
    { label: "省域", spanKm: 1024 },
    { label: "大区", spanKm: 2048 },
  ];
  const BOUNDARY_DIRECT_BASE_URL = "https://geo.datav.aliyun.com/areas_v3/bound";
  const TAIWAN_BOUNDARY_URL =
    "https://raw.githubusercontent.com/g0v/twgeojson/master/json/twCounty2010merge.topo.json";
  const TAIWAN_BOUNDARY_NAMES_BY_CODE = {
    710100: ["台北市", "臺北市"],
    710200: ["新北市"],
    710300: ["桃園縣", "桃園市", "桃园县", "桃园市"],
    710400: ["台中市", "臺中市"],
    710500: ["台南市", "臺南市"],
    710600: ["高雄市"],
  };
  const STORAGE_KEY = "skyeye-345-stats-v1";
  const PROVINCES = [
    { code: "special", codes: ["11", "12", "31", "50", "81", "82"], name: "京津沪渝港澳", short: "" },
    { code: "13", codes: ["13"], name: "河北", short: "冀" },
    { code: "14", codes: ["14"], name: "山西", short: "晋" },
    { code: "15", codes: ["15"], name: "内蒙古", short: "蒙" },
    { code: "21", codes: ["21"], name: "辽宁", short: "辽" },
    { code: "22", codes: ["22"], name: "吉林", short: "吉" },
    { code: "23", codes: ["23"], name: "黑龙江", short: "黑" },
    { code: "32", codes: ["32"], name: "江苏", short: "苏" },
    { code: "33", codes: ["33"], name: "浙江", short: "浙" },
    { code: "34", codes: ["34"], name: "安徽", short: "皖" },
    { code: "35", codes: ["35"], name: "福建", short: "闽" },
    { code: "36", codes: ["36"], name: "江西", short: "赣" },
    { code: "37", codes: ["37"], name: "山东", short: "鲁" },
    { code: "41", codes: ["41"], name: "河南", short: "豫" },
    { code: "42", codes: ["42"], name: "湖北", short: "鄂" },
    { code: "43", codes: ["43"], name: "湖南", short: "湘" },
    { code: "44", codes: ["44"], name: "广东", short: "粤" },
    { code: "45", codes: ["45"], name: "广西", short: "桂" },
    { code: "46", codes: ["46"], name: "海南", short: "琼" },
    { code: "51", codes: ["51"], name: "四川", short: "川" },
    { code: "52", codes: ["52"], name: "贵州", short: "贵" },
    { code: "53", codes: ["53"], name: "云南", short: "云" },
    { code: "54", codes: ["54"], name: "西藏", short: "藏" },
    { code: "61", codes: ["61"], name: "陕西", short: "陕" },
    { code: "62", codes: ["62"], name: "甘肃", short: "甘" },
    { code: "63", codes: ["63"], name: "青海", short: "青" },
    { code: "64", codes: ["64"], name: "宁夏", short: "宁" },
    { code: "65", codes: ["65"], name: "新疆", short: "新" },
    { code: "71", codes: ["71"], name: "台湾", short: "台" },
  ];

  const cities = Array.isArray(window.CITY_DATA) ? window.CITY_DATA : [];
  const cityByCleanName = new Map(cities.map((city) => [normalizeName(city.name), city]));
  const cityByCode = new Map(cities.map((city) => [String(city.code), city]));
  const cityShortByCode = buildCityShortByCode();
  const cityGroups = buildCityGroups(cities);
  const citySearchEntries = cities.map(buildCitySearchEntry);
  const boundaryCache = new Map();
  let taiwanBoundaryPromise = null;

  const els = {};
  let map = null;
  let answerMarker = null;
  let targetBoundaryLayer = null;
  let guessBoundaryLayerGroup = null;
  let guessLabelLayerGroup = null;
  let boundaryRenderToken = 0;
  let mapRefreshFrame = null;
  let correctingMapView = false;
  let highlightedSuggestion = -1;
  let stats = loadStats();
  let state = createEmptyState();

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    cacheElements();
    renderZoomStack();
    bindEvents();
    setCityCount();
    refreshIcons();

    const firstTarget = getDailyTarget();
    startGame(firstTarget, "daily", shanghaiDateKey());
    initMap();
    updateStatsView();
  }

  function cacheElements() {
    [
      "map",
      "targetMode",
      "zoomStack",
      "newRoundButton",
      "roundLabel",
      "cityCount",
      "streakCount",
      "guessForm",
      "cityInput",
      "suggestions",
      "openPickerButton",
      "cityPickerDialog",
      "closePickerButton",
      "cityFilter",
      "clearPickerFilterButton",
      "pickerRemain",
      "cityBoard",
      "feedbackIcon",
      "feedbackTitle",
      "feedbackText",
      "history",
      "giveUpButton",
      "resetButton",
      "shareButton",
      "resultDialog",
      "closeDialogButton",
      "resultEyebrow",
      "resultTitle",
      "resultText",
      "dialogNewRoundButton",
      "dialogShareButton",
    ].forEach((id) => {
      els[id] = document.getElementById(id);
    });
  }

  function bindEvents() {
    els.guessForm.addEventListener("submit", handleSubmit);
    els.cityInput.addEventListener("input", handleInput);
    els.cityInput.addEventListener("keydown", handleSuggestionKeys);
    els.cityInput.addEventListener("focus", handleInput);

    document.addEventListener("click", (event) => {
      if (!els.guessForm.contains(event.target)) {
        closeSuggestions();
      }
    });

    els.newRoundButton.addEventListener("click", () => {
      startGame(getRandomTarget(), "random", `R${Date.now().toString(36)}`);
    });

    els.openPickerButton.addEventListener("click", openCityPicker);
    els.closePickerButton.addEventListener("click", closeCityPicker);
    els.cityFilter.addEventListener("input", renderCityBoard);
    els.clearPickerFilterButton.addEventListener("click", () => {
      els.cityFilter.value = "";
      renderCityBoard();
      els.cityFilter.focus();
    });
    els.cityPickerDialog.addEventListener("click", (event) => {
      if (event.target === els.cityPickerDialog) {
        closeCityPicker();
      }
    });

    els.dialogNewRoundButton.addEventListener("click", () => {
      closeDialog();
      startGame(getRandomTarget(), "random", `R${Date.now().toString(36)}`);
    });

    els.resetButton.addEventListener("click", () => {
      startGame(state.target, state.mode, state.puzzleKey);
    });

    els.giveUpButton.addEventListener("click", () => {
      if (!state.finished) {
        finishGame(false, true);
      }
    });

    els.shareButton.addEventListener("click", copyShareText);
    els.dialogShareButton.addEventListener("click", copyShareText);
    els.closeDialogButton.addEventListener("click", closeDialog);
  }

  function initMap() {
    if (!window.L) {
      els.map.innerHTML = '<div class="history-empty">卫星底图暂时没有加载成功</div>';
      setFeedback("triangle-alert", "底图连接失败", "请检查网络后刷新页面。");
      return;
    }

    map = L.map("map", {
      zoomControl: false,
      attributionControl: true,
      zoomSnap: 0,
      zoomDelta: 0.25,
      maxBoundsViscosity: 1,
      bounceAtZoomLimits: false,
      dragging: true,
      touchZoom: "center",
      scrollWheelZoom: "center",
      doubleClickZoom: "center",
      boxZoom: false,
      keyboard: true,
      tap: true,
    });
    createMapPanes();

    L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      {
        maxZoom: 18,
        minZoom: 3,
        attribution:
          "Tiles &copy; Esri, Maxar, Earthstar Geographics, and the GIS User Community",
      },
    ).addTo(map);

    guessBoundaryLayerGroup = L.layerGroup().addTo(map);
    guessLabelLayerGroup = L.layerGroup().addTo(map);
    setMapView(true);
    renderTargetBoundary(boundaryRenderToken);
    map.on("dragend zoomend", () => applyMapConstraints());
    map.on("resize", () => applyMapConstraints());
    window.addEventListener("resize", scheduleMapRefresh);
    window.setTimeout(() => {
      map.invalidateSize({ animate: false });
      setMapView(true);
    }, 120);
  }

  function createMapPanes() {
    ["boundaryPane", "boundaryLabelPane"].forEach((paneName) => {
      if (!map.getPane(paneName)) {
        map.createPane(paneName);
      }
    });

    const boundaryPane = map.getPane("boundaryPane");
    const labelPane = map.getPane("boundaryLabelPane");
    boundaryPane.style.zIndex = 430;
    boundaryPane.style.pointerEvents = "none";
    labelPane.style.zIndex = 440;
    labelPane.style.pointerEvents = "none";
  }

  function createEmptyState() {
    return {
      target: null,
      attempts: [],
      currentStep: 0,
      finished: false,
      won: false,
      mode: "daily",
      puzzleKey: "",
      recorded: false,
    };
  }

  function startGame(target, mode, puzzleKey) {
    if (!target) {
      setFeedback("triangle-alert", "题库为空", "没有找到城市数据。");
      return;
    }

    state = {
      ...createEmptyState(),
      target,
      mode,
      puzzleKey,
    };
    boundaryRenderToken += 1;

    if (answerMarker) {
      answerMarker.remove();
      answerMarker = null;
    }
    clearBoundaryLayers();

    closeSuggestions();
    closeCityPicker();
    closeDialog();
    els.cityInput.value = "";
    els.cityInput.disabled = false;
    els.openPickerButton.disabled = false;
    els.shareButton.disabled = true;
    els.giveUpButton.disabled = false;
    els.targetMode.textContent = mode === "daily" ? "今日挑战" : "随机开局";

    applyMapConstraints();
    setFeedback("radar", "正在接收卫星影像", "观察城市肌理、河流、海岸和山地轮廓。");
    renderHistory();
    renderCityBoard();
    updateRoundLabel();
    renderZoomStack();
    setMapView(true);
    renderTargetBoundary(boundaryRenderToken);
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (state.finished || !state.target) {
      return;
    }

    const rawValue = els.cityInput.value;
    const guess = resolveCity(rawValue);
    const cleaned = normalizeName(rawValue);

    if (!guess) {
      const message = OUT_OF_SCOPE.has(cleaned)
        ? "这个名称暂时不在题库里。"
        : "请从题库里选择一个城市。";
      setFeedback("circle-alert", "没有匹配到城市", message);
      return;
    }

    submitGuess(guess, "input");
  }

  function submitGuess(guess, source = "input") {
    if (state.finished || !state.target || !guess) {
      return false;
    }

    if (state.attempts.some((attempt) => attempt.city.name === guess.name)) {
      setFeedback("repeat-2", "已经猜过了", `${guess.name} 已在记录里。`);
      if (source === "input") {
        els.cityInput.select();
      }
      return false;
    }

    const distance = haversineKm(guess, state.target);
    const bearing = initialBearing(guess, state.target);
    const correct = guess.name === state.target.name;

    state.attempts.push({
      city: guess,
      distance,
      bearing,
      correct,
    });

    els.cityInput.value = "";
    closeSuggestions();
    renderCityBoard();

    if (correct) {
      finishGame(true, false);
      return true;
    }

    renderWrongGuessBoundary(guess, boundaryRenderToken);

    if (state.attempts.length >= MAX_ATTEMPTS) {
      finishGame(false, false);
      return true;
    }

    state.currentStep = Math.min(state.attempts.length, ZOOM_STEPS.length - 1);
    setMapView(false);
    renderHistory();
    updateRoundLabel();
    renderZoomStack();
    setDirectionalFeedback(
      "navigation",
      `${guess.name} 不是目标`,
      distance,
      bearing,
      ZOOM_STEPS[state.currentStep].label,
    );
    return true;
  }

  function handleInput() {
    if (state.finished) {
      closeSuggestions();
      return;
    }

    const query = els.cityInput.value;
    if (!normalizeName(query) && !normalizePinyin(query)) {
      closeSuggestions();
      return;
    }

    const matches = getCityMatches(query, cities.length)
      .filter((city) => !state.attempts.some((attempt) => attempt.city.name === city.name))
      .slice(0, 8);

    renderSuggestions(matches);
  }

  function handleSuggestionKeys(event) {
    const items = Array.from(els.suggestions.querySelectorAll(".suggestion"));
    if (!items.length) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      highlightedSuggestion = (highlightedSuggestion + 1) % items.length;
      updateSuggestionHighlight(items);
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      highlightedSuggestion = (highlightedSuggestion - 1 + items.length) % items.length;
      updateSuggestionHighlight(items);
    }

    if (event.key === "Enter" && highlightedSuggestion >= 0) {
      event.preventDefault();
      items[highlightedSuggestion].click();
    }

    if (event.key === "Escape") {
      closeSuggestions();
    }
  }

  function renderSuggestions(matches) {
    highlightedSuggestion = -1;
    els.cityInput.setAttribute("aria-expanded", matches.length > 0 ? "true" : "false");
    els.suggestions.classList.toggle("is-open", matches.length > 0);
    els.suggestions.innerHTML = matches
      .map(
        (city, index) => `
          <button class="suggestion" type="button" role="option" data-index="${index}" data-name="${city.name}">
            <span>${city.name}</span>
            <small>${city.code}</small>
          </button>
        `,
      )
      .join("");

    els.suggestions.querySelectorAll(".suggestion").forEach((button) => {
      button.addEventListener("click", () => {
        els.cityInput.value = button.dataset.name;
        closeSuggestions();
        els.cityInput.focus();
      });
    });
  }

  function updateSuggestionHighlight(items) {
    items.forEach((item, index) => {
      item.classList.toggle("is-highlighted", index === highlightedSuggestion);
    });
  }

  function closeSuggestions() {
    highlightedSuggestion = -1;
    els.cityInput?.setAttribute("aria-expanded", "false");
    els.suggestions?.classList.remove("is-open");
    if (els.suggestions) {
      els.suggestions.innerHTML = "";
    }
  }

  function finishGame(won, gaveUp) {
    state.finished = true;
    state.won = won;
    state.currentStep = ZOOM_STEPS.length - 1;
    els.cityInput.disabled = true;
    els.openPickerButton.disabled = true;
    els.shareButton.disabled = false;
    els.giveUpButton.disabled = true;

    revealAnswer();
    renderHistory();
    renderCityBoard();
    updateRoundLabel();
    renderZoomStack();
    recordStats(won);
    updateStatsView();

    const answer = state.target.name;
    if (won) {
      setFeedback(
        "badge-check",
        `命中 ${answer}`,
        `第 ${state.attempts.length} 次锁定目标。`,
      );
      showResult("命中目标", `答案是 ${answer}`, `你在第 ${state.attempts.length} 次猜中了。`);
      return;
    }

    const title = gaveUp ? "已揭晓" : "机会用完";
    setFeedback("map-pin", `${title}: ${answer}`, "答案已在地图上标出。");
    showResult(title, `答案是 ${answer}`, "答案位置已标出，可以换一题继续。");
  }

  function revealAnswer() {
    if (!map || !window.L || !state.target) {
      return;
    }

    if (!answerMarker) {
      answerMarker = L.marker([state.target.lat, state.target.lng], {
        icon: L.divIcon({
          className: "",
          html: '<span class="answer-marker"></span>',
          iconSize: [26, 26],
          iconAnchor: [13, 13],
        }),
        title: state.target.name,
      }).addTo(map);
    }

    applyMapConstraints();
    setMapView(false);
  }

  function clearBoundaryLayers() {
    if (targetBoundaryLayer) {
      targetBoundaryLayer.remove();
      targetBoundaryLayer = null;
    }
    guessBoundaryLayerGroup?.clearLayers();
    guessLabelLayerGroup?.clearLayers();
  }

  async function renderTargetBoundary(token) {
    if (!map || !window.L || !state.target) {
      return;
    }

    const target = state.target;
    const geojson = await loadBoundary(target);
    if (token !== boundaryRenderToken || target !== state.target || !geojson) {
      return;
    }

    if (targetBoundaryLayer) {
      targetBoundaryLayer.remove();
    }

    targetBoundaryLayer = L.geoJSON(geojson, {
      pane: "boundaryPane",
      interactive: false,
      className: "target-boundary-path",
      style: {
        color: "#48e0a4",
        weight: 4,
        opacity: 1,
        fill: false,
        fillOpacity: 0,
      },
    }).addTo(map);

    targetBoundaryLayer.bringToFront();
    applyMapConstraints();
  }

  async function renderWrongGuessBoundary(city, token) {
    if (!map || !window.L || !city || !guessBoundaryLayerGroup || !guessLabelLayerGroup) {
      return;
    }

    const geojson = await loadBoundary(city);
    if (token !== boundaryRenderToken || !state.attempts.some((attempt) => attempt.city === city) || !geojson) {
      return;
    }

    const layer = L.geoJSON(geojson, {
      pane: "boundaryPane",
      interactive: false,
      className: "wrong-boundary-path",
      style: {
        color: "#e7c874",
        weight: 3,
        opacity: 0.98,
        fill: true,
        fillColor: "rgba(231, 200, 116, 0.14)",
        fillOpacity: 0.26,
      },
    }).addTo(guessBoundaryLayerGroup);

    window.requestAnimationFrame(() => {
      applyWrongBoundaryPattern(layer);
      targetBoundaryLayer?.bringToFront();
    });

    const centroid = getGeoJsonCentroid(geojson, city);
    L.marker(centroid, {
      pane: "boundaryLabelPane",
      interactive: false,
      keyboard: false,
      icon: L.divIcon({
        className: "wrong-boundary-label",
        html: `<span>${escapeHtml(city.name)}</span>`,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      }),
    }).addTo(guessLabelLayerGroup);

    targetBoundaryLayer?.bringToFront();
    applyMapConstraints();
  }

  async function loadBoundary(city) {
    const code = String(city?.code || "");
    if (!code) {
      return null;
    }

    if (TAIWAN_BOUNDARY_NAMES_BY_CODE[code]) {
      return loadTaiwanBoundary(code);
    }

    if (!boundaryCache.has(code)) {
      boundaryCache.set(
        code,
        fetch(getBoundaryUrl(code))
          .then((response) => {
            if (!response.ok) {
              throw new Error(`Boundary ${code} returned ${response.status}`);
            }
            return response.json();
          })
          .then((geojson) => (hasGeoJsonGeometry(geojson) ? geojson : null))
          .catch((error) => {
            console.warn("行政区边界加载失败", city?.name || code, error);
            return null;
          }),
      );
    }

    return boundaryCache.get(code);
  }

  function getBoundaryUrl(code) {
    if (shouldUseBoundaryProxy()) {
      return `/api/boundary?code=${encodeURIComponent(code)}`;
    }

    return `${BOUNDARY_DIRECT_BASE_URL}/${code}.json`;
  }

  function shouldUseBoundaryProxy() {
    const hostname = window.location.hostname;
    return Boolean(
      hostname &&
        hostname !== "localhost" &&
        hostname !== "127.0.0.1" &&
        hostname !== "::1",
    );
  }

  async function loadTaiwanBoundary(code) {
    if (!taiwanBoundaryPromise) {
      taiwanBoundaryPromise = fetch(TAIWAN_BOUNDARY_URL)
        .then((response) => {
          if (!response.ok) {
            throw new Error(`Taiwan boundary returned ${response.status}`);
          }
          return response.json();
        })
        .then(topoToFeatureCollection)
        .catch((error) => {
          console.warn("台湾边界加载失败", error);
          return null;
        });
    }

    const names = TAIWAN_BOUNDARY_NAMES_BY_CODE[code];
    const featureCollection = await taiwanBoundaryPromise;
    const feature = featureCollection?.features?.find((item) => {
      const name = item.properties?.name || item.properties?.COUNTYNAME;
      return names.includes(name);
    });

    return feature ? { type: "FeatureCollection", features: [feature] } : null;
  }

  function topoToFeatureCollection(topology) {
    const objectName = Object.keys(topology.objects || {})[0];
    const object = topology.objects?.[objectName];
    if (!object?.geometries) {
      return null;
    }

    return {
      type: "FeatureCollection",
      features: object.geometries
        .map((geometry) => ({
          type: "Feature",
          properties: geometry.properties || {},
          geometry: topoGeometryToGeoJson(topology, geometry),
        }))
        .filter((feature) => feature.geometry),
    };
  }

  function topoGeometryToGeoJson(topology, geometry) {
    if (geometry.type === "Polygon") {
      return {
        type: "Polygon",
        coordinates: geometry.arcs.map((ring) => stitchTopoArcs(topology, ring)),
      };
    }

    if (geometry.type === "MultiPolygon") {
      return {
        type: "MultiPolygon",
        coordinates: geometry.arcs.map((polygon) =>
          polygon.map((ring) => stitchTopoArcs(topology, ring)),
        ),
      };
    }

    return null;
  }

  function stitchTopoArcs(topology, arcIndexes) {
    return arcIndexes.flatMap((arcIndex, index) => {
      const points = decodeTopoArc(topology, arcIndex);
      return index === 0 ? points : points.slice(1);
    });
  }

  function decodeTopoArc(topology, arcIndex) {
    const reversed = arcIndex < 0;
    const encodedArc = topology.arcs[reversed ? ~arcIndex : arcIndex] || [];
    const scale = topology.transform?.scale || [1, 1];
    const translate = topology.transform?.translate || [0, 0];
    let x = 0;
    let y = 0;
    const points = encodedArc.map(([dx, dy]) => {
      x += dx;
      y += dy;
      return [x * scale[0] + translate[0], y * scale[1] + translate[1]];
    });

    return reversed ? points.reverse() : points;
  }

  function hasGeoJsonGeometry(geojson) {
    if (!geojson) {
      return false;
    }
    if (geojson.type === "FeatureCollection") {
      return Array.isArray(geojson.features) && geojson.features.length > 0;
    }
    if (geojson.type === "Feature") {
      return Boolean(geojson.geometry);
    }
    return Boolean(geojson.type && geojson.coordinates);
  }

  function applyWrongBoundaryPattern(layer) {
    if (!ensureWrongBoundaryPattern()) {
      return;
    }

    walkLeafletPaths(layer, (path) => {
      path.setAttribute("fill", "url(#skyeye-wrong-hatch)");
      path.setAttribute("fill-opacity", "1");
    });
  }

  function ensureWrongBoundaryPattern() {
    const svg =
      map?.getPane("boundaryPane")?.querySelector("svg") ||
      map?.getPanes()?.overlayPane?.querySelector("svg");
    if (!svg) {
      return false;
    }

    const namespace = "http://www.w3.org/2000/svg";
    let defs = svg.querySelector("defs");
    if (!defs) {
      defs = document.createElementNS(namespace, "defs");
      svg.insertBefore(defs, svg.firstChild);
    }

    if (defs.querySelector("#skyeye-wrong-hatch")) {
      return true;
    }

    const pattern = document.createElementNS(namespace, "pattern");
    pattern.setAttribute("id", "skyeye-wrong-hatch");
    pattern.setAttribute("patternUnits", "userSpaceOnUse");
    pattern.setAttribute("width", "10");
    pattern.setAttribute("height", "10");
    pattern.setAttribute("patternTransform", "rotate(45)");

    const stripe = document.createElementNS(namespace, "path");
    stripe.setAttribute("d", "M 0 0 L 0 10");
    stripe.setAttribute("stroke", "#e7c874");
    stripe.setAttribute("stroke-opacity", "0.38");
    stripe.setAttribute("stroke-width", "2.6");

    pattern.append(stripe);
    defs.append(pattern);
    return true;
  }

  function walkLeafletPaths(layer, callback) {
    if (!layer) {
      return;
    }
    if (layer._path) {
      callback(layer._path);
    }
    if (typeof layer.eachLayer === "function") {
      layer.eachLayer((childLayer) => walkLeafletPaths(childLayer, callback));
    }
  }

  function getGeoJsonCentroid(geojson, fallbackCity) {
    const total = { weight: 0, lat: 0, lng: 0 };
    collectOuterRings(geojson, (ring) => accumulateRingCentroid(ring, total));

    if (total.weight > 0) {
      return [total.lat / total.weight, total.lng / total.weight];
    }

    return [fallbackCity.lat, fallbackCity.lng];
  }

  function collectOuterRings(entity, callback) {
    if (!entity) {
      return;
    }

    if (entity.type === "FeatureCollection") {
      entity.features.forEach((feature) => collectOuterRings(feature, callback));
      return;
    }

    if (entity.type === "Feature") {
      collectOuterRings(entity.geometry, callback);
      return;
    }

    if (entity.type === "GeometryCollection") {
      entity.geometries.forEach((geometry) => collectOuterRings(geometry, callback));
      return;
    }

    if (entity.type === "Polygon") {
      callback(entity.coordinates?.[0]);
      return;
    }

    if (entity.type === "MultiPolygon") {
      entity.coordinates.forEach((polygon) => callback(polygon?.[0]));
    }
  }

  function accumulateRingCentroid(ring, total) {
    if (!Array.isArray(ring) || ring.length < 3) {
      return;
    }

    let twiceArea = 0;
    let weightedLng = 0;
    let weightedLat = 0;
    for (let index = 0; index < ring.length; index += 1) {
      const current = ring[index];
      const next = ring[(index + 1) % ring.length];
      if (!current || !next) {
        continue;
      }
      const [lng1, lat1] = current;
      const [lng2, lat2] = next;
      const cross = lng1 * lat2 - lng2 * lat1;
      twiceArea += cross;
      weightedLng += (lng1 + lng2) * cross;
      weightedLat += (lat1 + lat2) * cross;
    }

    if (Math.abs(twiceArea) < 1e-8) {
      return;
    }

    const area = Math.abs(twiceArea / 2);
    total.lng += (weightedLng / (3 * twiceArea)) * area;
    total.lat += (weightedLat / (3 * twiceArea)) * area;
    total.weight += area;
  }

  function showResult(eyebrow, title, text) {
    els.resultEyebrow.textContent = eyebrow;
    els.resultTitle.textContent = title;
    els.resultText.textContent = text;
    if (typeof els.resultDialog.showModal === "function") {
      els.resultDialog.showModal();
    }
  }

  function closeDialog() {
    if (els.resultDialog?.open) {
      els.resultDialog.close();
    }
  }

  function openCityPicker() {
    if (state.finished) {
      return;
    }

    closeSuggestions();
    renderCityBoard();
    if (typeof els.cityPickerDialog.showModal === "function") {
      els.cityPickerDialog.showModal();
    }
    window.setTimeout(() => els.cityFilter.focus(), 0);
  }

  function closeCityPicker() {
    if (els.cityPickerDialog?.open) {
      els.cityPickerDialog.close();
    }
  }

  function renderCityBoard() {
    if (!els.cityBoard) {
      return;
    }

    const guessed = new Set(state.attempts.map((attempt) => attempt.city.name));
    const query = normalizeName(els.cityFilter?.value || "");
    const columns = [];
    let visibleCount = 0;
    let previousRegion = "";

    cityGroups.forEach((group) => {
      const groupMatchesQuery = normalizeName(group.name).includes(query);
      const groupCities = group.cities.filter((city) => {
        if (!query) {
          return true;
        }
        return groupMatchesQuery || normalizeName(city.name).includes(query);
      });

      if (query && !groupMatchesQuery && !groupCities.length) {
        return;
      }

      visibleCount += groupCities.length;
      const region = getGroupRegion(group);
      const className = [
        "province-column",
        groupCities.length ? "" : "is-empty",
        group.code === "special" ? "is-special" : "",
      ]
        .filter(Boolean)
        .join(" ");

      if (previousRegion && previousRegion !== region && !query) {
        columns.push('<div class="region-gap" aria-hidden="true"></div>');
      }
      previousRegion = region;

      columns.push(`
        <section class="${className}">
          <div class="province-column-head" title="${escapeHtml(group.name)}">
            <strong>${escapeHtml(group.short || group.name)}</strong>
            <span>${group.cities.length || "-"}</span>
          </div>
          <div class="province-column-cities">
            ${groupCities
              .map((city) => {
                const used = guessed.has(city.name);
                return `
                  <button
                    class="city-chip ${used ? "is-used" : ""}"
                    type="button"
                    data-code="${escapeHtml(String(city.code))}"
                    title="${escapeHtml(`${city.name} ${city.code}`)}"
                    ${used || state.finished ? "disabled" : ""}
                  >${escapeHtml(getCityShort(city))}</button>
                `;
              })
              .join("")}
          </div>
        </section>
      `);
    });

    const fullBoard = !query;
    els.cityBoard.classList.toggle("is-filtered", !fullBoard);
    els.pickerRemain.textContent = query
      ? `匹配 ${visibleCount}`
      : `未猜 ${Math.max(cities.length - guessed.size, 0)}`;
    els.cityBoard.innerHTML = columns.length
      ? columns.join("")
      : '<div class="history-empty compact-empty">没有匹配城市</div>';

    els.cityBoard.querySelectorAll(".city-chip:not(:disabled)").forEach((button) => {
      button.addEventListener("click", () => {
        const city = cityByCode.get(button.dataset.code);
        if (!city) {
          return;
        }
        closeCityPicker();
        submitGuess(city, "picker");
      });
    });
  }

  function renderHistory() {
    if (!state.attempts.length) {
      els.history.innerHTML = '<div class="history-empty">暂无记录</div>';
      return;
    }

    els.history.innerHTML = state.attempts
      .map((attempt, index) => {
        const temperature = getTemperature(attempt.distance, attempt.correct);
        const indexClass = attempt.correct
          ? "is-correct"
          : state.finished && index === state.attempts.length - 1
            ? "is-final"
            : "";
        const hint = attempt.correct
          ? "命中"
          : `${formatKm(attempt.distance)} ${renderDirectionArrow(attempt.bearing)}`;
        return `
          <div class="history-row">
            <span class="try-index ${indexClass}">${index + 1}</span>
            <span>
              <strong class="history-name">${attempt.city.name}</strong>
              <small class="history-hint">${hint}</small>
            </span>
            <span class="temperature ${temperature.className}">${temperature.label}</span>
          </div>
        `;
      })
      .join("");
  }

  function renderZoomStack() {
    if (!els.zoomStack) {
      return;
    }

    els.zoomStack.innerHTML = ZOOM_STEPS.map((step, index) => {
      const className =
        index === state.currentStep ? "is-active" : index < state.currentStep ? "is-past" : "";
      return `<span class="zoom-step ${className}" title="${step.label}">${index + 1}</span>`;
    }).join("");
  }

  function updateRoundLabel() {
    const round = Math.min(state.attempts.length + 1, MAX_ATTEMPTS);
    els.roundLabel.textContent = state.finished
      ? `${state.attempts.length} / ${MAX_ATTEMPTS}`
      : `${round} / ${MAX_ATTEMPTS}`;
  }

  function setCityCount() {
    els.cityCount.textContent = cities.length.toString();
  }

  function updateStatsView() {
    els.streakCount.textContent = stats.streak.toString();
  }

  function setFeedback(icon, title, text) {
    els.feedbackIcon.innerHTML = `<i data-lucide="${icon}"></i>`;
    els.feedbackTitle.textContent = title;
    els.feedbackText.textContent = text;
    refreshIcons();
  }

  function setDirectionalFeedback(icon, title, distance, bearing, stepLabel) {
    els.feedbackIcon.innerHTML = `<i data-lucide="${icon}"></i>`;
    els.feedbackTitle.textContent = title;
    els.feedbackText.innerHTML = `距目标约 ${formatKm(distance)} ${renderDirectionArrow(
      bearing,
    )}，视野已扩大到${escapeHtml(stepLabel)}。`;
    refreshIcons();
  }

  function renderDirectionArrow(bearing) {
    const normalizedBearing = Number.isFinite(bearing) ? bearing : 0;
    return `<span class="direction-arrow" style="--bearing:${normalizedBearing.toFixed(
      2,
    )}deg" aria-label="指向目标">↑</span>`;
  }

  function scheduleMapRefresh() {
    if (!map) {
      return;
    }

    if (mapRefreshFrame !== null) {
      window.cancelAnimationFrame(mapRefreshFrame);
    }

    mapRefreshFrame = window.requestAnimationFrame(() => {
      mapRefreshFrame = null;
      map.invalidateSize({ animate: false });
      setMapView(true);
    });
  }

  function setMapView(instant) {
    if (!map || !state.target) {
      return;
    }

    const bounds = getCurrentAllowedBounds();
    applyMapConstraints(bounds, { correct: false });
    map.stop();
    if (instant) {
      map.fitBounds(bounds, {
        animate: false,
        padding: [0, 0],
      });
    } else {
      map.flyToBounds(bounds, {
        duration: 0.9,
        easeLinearity: 0.25,
        padding: [0, 0],
      });
    }
  }

  function applyMapConstraints(bounds = getCurrentAllowedBounds(), options = {}) {
    if (!map || !bounds) {
      return undefined;
    }

    const { correct = true, pan = true } = options;

    const rawMinZoom = map.getBoundsZoom(bounds, true, L.point(0, 0));
    if (!Number.isFinite(rawMinZoom)) {
      map.setMaxBounds(bounds);
      return undefined;
    }

    const maxZoom = Number.isFinite(map.getMaxZoom()) ? map.getMaxZoom() : 18;
    const maxRangeZoom = Math.min(maxZoom, Math.max(3, rawMinZoom));
    map.setMinZoom(3);
    map.setMaxBounds(bounds);

    if (!correct || !map._loaded || correctingMapView) {
      return maxRangeZoom;
    }

    if (boundsContainBounds(bounds, map.getBounds())) {
      return maxRangeZoom;
    }

    correctingMapView = true;
    if (map.getZoom() < maxRangeZoom - 0.01) {
      map.fitBounds(bounds, {
        animate: false,
        padding: [0, 0],
      });
    } else if (pan) {
      map.panInsideBounds(bounds, { animate: false });
    }
    correctingMapView = false;
    return maxRangeZoom;
  }

  function getCurrentAllowedBounds() {
    if (!map || !window.L || !state.target) {
      return null;
    }

    const step = ZOOM_STEPS[state.currentStep];
    return L.latLngBounds(getFairViewBounds(state.target, step.spanKm));
  }

  function boundsContainBounds(outerBounds, innerBounds) {
    const epsilon = 1e-7;
    return (
      innerBounds.getSouth() >= outerBounds.getSouth() - epsilon &&
      innerBounds.getNorth() <= outerBounds.getNorth() + epsilon &&
      innerBounds.getWest() >= outerBounds.getWest() - epsilon &&
      innerBounds.getEast() <= outerBounds.getEast() + epsilon
    );
  }

  function getFairViewBounds(center, spanKm) {
    const aspectRatio = getMapAspectRatio();
    const latSpanKm = aspectRatio >= 1 ? spanKm : spanKm / aspectRatio;
    const lngSpanKm = aspectRatio >= 1 ? spanKm * aspectRatio : spanKm;
    const latDelta = latSpanKm / 2 / 111.32;
    const lngScale = Math.max(Math.cos(toRadians(center.lat)), 0.2);
    const lngDelta = lngSpanKm / 2 / (111.32 * lngScale);

    return [
      [center.lat - latDelta, center.lng - lngDelta],
      [center.lat + latDelta, center.lng + lngDelta],
    ];
  }

  function getMapAspectRatio() {
    const size = map?.getSize?.();
    if (!size || !size.x || !size.y) {
      return 1;
    }

    return Math.min(3, Math.max(0.34, size.x / size.y));
  }

  function refreshIcons() {
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  function resolveCity(value) {
    const cleanValue = normalizeName(value);
    const pinyinValue = normalizePinyin(value);
    if (!cleanValue && !pinyinValue) {
      return null;
    }

    if (cleanValue && cityByCleanName.has(cleanValue)) {
      return cityByCleanName.get(cleanValue);
    }

    if (cleanValue.length >= 2) {
      const fuzzyNameMatch = cities.find((city) => {
        const cleanName = normalizeName(city.name);
        return cleanName.includes(cleanValue) || cleanValue.includes(cleanName);
      });

      if (fuzzyNameMatch) {
        return fuzzyNameMatch;
      }
    }

    if (pinyinValue) {
      const exactPinyinMatches = citySearchEntries.filter((entry) =>
        entry.pinyinExactTokens.has(pinyinValue),
      );
      if (exactPinyinMatches.length === 1) {
        return exactPinyinMatches[0].city;
      }

      const pinyinMatches = getCityMatches(value, cities.length);
      return pinyinMatches.length === 1 ? pinyinMatches[0] : null;
    }

    return null;
  }

  function getCityMatches(value, limit = 8) {
    const cleanQuery = normalizeName(value);
    const pinyinQuery = normalizePinyin(value);
    if (!cleanQuery && !pinyinQuery) {
      return [];
    }

    return citySearchEntries
      .map((entry) => {
        const score = getCityMatchScore(entry, cleanQuery, pinyinQuery);
        return score === null ? null : { ...entry, score };
      })
      .filter(Boolean)
      .sort((a, b) => a.score - b.score || a.order - b.order)
      .slice(0, limit)
      .map((entry) => entry.city);
  }

  function getCityMatchScore(entry, cleanQuery, pinyinQuery) {
    let score = Number.POSITIVE_INFINITY;

    if (cleanQuery) {
      if (entry.cleanName === cleanQuery) {
        score = Math.min(score, 0);
      } else if (entry.cleanName.startsWith(cleanQuery)) {
        score = Math.min(score, 1);
      } else if (entry.cleanName.includes(cleanQuery)) {
        score = Math.min(score, 2);
      } else if (cleanQuery.includes(entry.cleanName)) {
        score = Math.min(score, 3);
      }
    }

    if (pinyinQuery && entry.pinyinTokens.size) {
      if (entry.pinyinExactTokens.has(pinyinQuery)) {
        score = Math.min(score, 10);
      } else if ([...entry.pinyinPrefixTokens].some((token) => token.startsWith(pinyinQuery))) {
        score = Math.min(score, 11);
      } else if ([...entry.pinyinTokens].some((token) => token.includes(pinyinQuery))) {
        score = Math.min(score, 12);
      }
    }

    return Number.isFinite(score) ? score : null;
  }

  function buildCitySearchEntry(city, order) {
    const cleanName = normalizeName(city.name);
    const syllables = getCityPinyinSyllables(city.name);
    const fullPinyinTokens = buildPinyinTokenVariants(syllables.join(""));
    const initialTokens = buildPinyinTokenVariants(syllables.map((syllable) => syllable[0]).join(""));
    const syllableTokens = syllables.flatMap(buildPinyinTokenVariants);
    const pinyinExactTokens = new Set([...fullPinyinTokens, ...initialTokens].filter(Boolean));
    const pinyinPrefixTokens = new Set([...pinyinExactTokens, ...syllableTokens].filter(Boolean));
    const pinyinTokens = new Set([...pinyinPrefixTokens]);

    return {
      city,
      order,
      cleanName,
      pinyinExactTokens,
      pinyinPrefixTokens,
      pinyinTokens,
    };
  }

  function getCityPinyinSyllables(name) {
    const pinyin = window.pinyinPro?.pinyin;
    if (typeof pinyin !== "function") {
      return [];
    }

    try {
      const result = pinyin(name, { toneType: "none", type: "array" });
      const syllables = Array.isArray(result) ? result : String(result).split(/\s+/);
      return syllables.map(normalizePinyin).filter(Boolean);
    } catch {
      return [];
    }
  }

  function buildPinyinTokenVariants(value) {
    const normalized = normalizePinyin(value);
    if (!normalized) {
      return [];
    }

    const looseUmlaut = normalized.replace(/v/g, "u");
    return [...new Set([normalized, looseUmlaut])];
  }

  function normalizePinyin(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/[āáǎà]/g, "a")
      .replace(/[ēéěè]/g, "e")
      .replace(/[īíǐì]/g, "i")
      .replace(/[ōóǒò]/g, "o")
      .replace(/[ūúǔù]/g, "u")
      .replace(/[ǖǘǚǜü]/g, "v")
      .replace(/u:/g, "v")
      .replace(/[^a-z0-9]/g, "");
  }

  function normalizeName(value) {
    return String(value || "")
      .trim()
      .replace(/\s+/g, "")
      .replace(/[()（）]/g, "")
      .replace(/(维吾尔|哈萨克|柯尔克孜|蒙古族|蒙古|藏族|羌族|苗族|侗族|土家族|布依族|彝族|傣族|景颇族|傈僳族|哈尼族|白族|回族|朝鲜族|壮族|瑶族)/g, "")
      .replace(/特别行政区$/g, "")
      .replace(/自治州$/g, "")
      .replace(/地区$/g, "")
      .replace(/盟$/g, "")
      .replace(/市$/g, "");
  }

  function buildCityGroups(sourceCities) {
    const provinceByCode = new Map();
    const groups = new Map();

    PROVINCES.forEach((province) => {
      province.codes.forEach((code) => {
        provinceByCode.set(code, province);
      });
      groups.set(province.code, { ...province, cities: [] });
    });

    sourceCities.forEach((city) => {
      const provinceCode = String(city.code).slice(0, 2);
      const province = provinceByCode.get(provinceCode);
      const groupCode = province?.code || provinceCode;
      if (!groups.has(groupCode)) {
        const fallback = province || {
          code: provinceCode,
          codes: [provinceCode],
          name: provinceCode,
          short: provinceCode,
        };
        groups.set(groupCode, { ...fallback, cities: [] });
      }
      groups.get(groupCode).cities.push(city);
    });

    return [...groups.values()].map((group) => ({
      ...group,
      cities: [...group.cities].sort((a, b) =>
        String(a.code).localeCompare(String(b.code), "zh-Hans-CN", { numeric: true }),
      ),
    }));
  }

  function getGroupRegion(group) {
    if (group.code === "special") {
      return "0";
    }
    return String(group.codes?.[0] || group.code).slice(0, 1);
  }

  function getCityShort(city) {
    return cityShortByCode[String(city.code)] || city.name.slice(0, 1);
  }

  function buildCityShortByCode() {
    const shortByCode = {};
    const addSequence = (prefix, chars) => {
      const provinceCode = prefix.slice(0, 2);
      const cityTens = Number(prefix[2]);

      [...chars].forEach((char, index) => {
        if (char === "." || char === " ") {
          return;
        }
        const cityNumber = cityTens * 10 + index + 1;
        shortByCode[`${provinceCode}${String(cityNumber).padStart(2, "0")}00`] = char;
      });
    };
    const add = (code, char) => {
      shortByCode[code] = char;
    };

    addSequence("130", "石唐秦邯邢保张承沧廊衡");
    addSequence("140", "太大阳长晋朔中运忻临吕");
    addSequence("150", "呼包乌赤通鄂呼巴乌");
    addSequence("152", ".兴..锡...阿");
    addSequence("210", "沈大鞍抚本丹锦营阜辽盘铁朝葫");
    addSequence("220", "长吉四辽通山松白");
    add("222400", "延");
    addSequence("230", "哈齐鸡鹤双大伊佳七牡黑绥");
    add("232700", "漠");
    addSequence("320", "宁锡徐常苏南连淮盐扬镇泰宿");
    addSequence("330", "杭宁温嘉湖绍金衢舟台丽");
    addSequence("340", "合芜蚌南马北铜安.黄滁阜宿.六亳池宣");
    addSequence("350", "福厦莆三泉漳南龙宁");
    addSequence("360", "南景萍九新鹰赣吉宜抚上");
    addSequence("370", "济青淄枣东烟潍济泰威日.临德聊滨菏");
    addSequence("410", "郑开洛平安鹤新焦濮许漯三南商信周驻");
    addSequence("420", "武黄十.宜襄鄂门孝荆冈咸随");
    add("422800", "恩");
    addSequence("430", "长株潭衡邵岳常张益郴永怀娄");
    add("433100", "吉");
    addSequence("440", "广韶深珠汕佛江湛茂.");
    addSequence("441", ".肇惠梅尾河阳清莞中");
    addSequence("445", "潮揭云");
    addSequence("450", "邕柳桂梧北防钦贵玉百贺河来崇");
    addSequence("460", "海三三儋");
    addSequence("510", "成.自攀泸德绵元遂内");
    addSequence("511", "乐.南眉宜广达雅巴资");
    addSequence("513", ".阿甘凉");
    addSequence("520", "贵六遵安毕铜");
    addSequence("522", "..兴..凯都");
    addSequence("530", "昆.曲玉保昭丽普临");
    addSequence("532", "..楚.红文.西大");
    addSequence("533", "德.怒迪");
    addSequence("540", "拉日昌林山那");
    add("542500", "阿");
    addSequence("610", "西铜宝咸渭延汉榆安商");
    addSequence("620", "兰嘉金白天武张平酒庆定陇");
    add("622900", "临");
    add("623000", "甘");
    addSequence("630", "西东");
    addSequence("632", ".北黄.南果玉西");
    addSequence("640", "银石吴固中");
    addSequence("650", "乌克.吐哈");
    addSequence("652", "..昌...博巴");
    add("653000", "克");
    add("654000", "伊");
    add("654200", "塔");
    add("654300", "阿");
    add("110000", "京");
    add("120000", "津");
    add("310000", "沪");
    add("500000", "渝");
    add("810000", "港");
    add("820000", "澳");
    add("710100", "北");
    add("710200", "北");
    add("710300", "桃");
    add("710400", "中");
    add("710500", "南");
    add("710600", "高");

    return shortByCode;
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function getDailyTarget() {
    if (!cities.length) {
      return null;
    }

    const key = shanghaiDateKey();
    return cities[hashString(key) % cities.length];
  }

  function getRandomTarget() {
    if (!cities.length) {
      return null;
    }

    if (window.crypto?.getRandomValues) {
      const buffer = new Uint32Array(1);
      window.crypto.getRandomValues(buffer);
      return cities[buffer[0] % cities.length];
    }

    return cities[Math.floor(Math.random() * cities.length)];
  }

  function hashString(value) {
    let hash = 2166136261;
    for (let index = 0; index < value.length; index += 1) {
      hash ^= value.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  function shanghaiDateKey(date = new Date()) {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Shanghai",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(date);
    const get = (type) => parts.find((part) => part.type === type)?.value;
    return `${get("year")}-${get("month")}-${get("day")}`;
  }

  function haversineKm(from, to) {
    const radius = 6371;
    const dLat = toRadians(to.lat - from.lat);
    const dLng = toRadians(to.lng - from.lng);
    const lat1 = toRadians(from.lat);
    const lat2 = toRadians(to.lat);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
    return radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  function initialBearing(from, to) {
    const lat1 = toRadians(from.lat);
    const lat2 = toRadians(to.lat);
    const dLng = toRadians(to.lng - from.lng);
    const y = Math.sin(dLng) * Math.cos(lat2);
    const x =
      Math.cos(lat1) * Math.sin(lat2) -
      Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
    return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
  }

  function bearingToArrowSymbol(bearing) {
    const arrows = ["↑", "↗", "→", "↘", "↓", "↙", "←", "↖"];
    return arrows[Math.round((bearing || 0) / 45) % arrows.length];
  }

  function toRadians(degrees) {
    return (degrees * Math.PI) / 180;
  }

  function formatKm(distance) {
    if (distance < 10) {
      return `${distance.toFixed(1)} km`;
    }
    return `${Math.round(distance)} km`;
  }

  function getTemperature(distance, correct) {
    if (correct) {
      return { label: "命中", className: "hit" };
    }
    if (distance < 90) {
      return { label: "烫手", className: "hot" };
    }
    if (distance < 320) {
      return { label: "很近", className: "warm" };
    }
    if (distance < 900) {
      return { label: "接近", className: "" };
    }
    return { label: "偏远", className: "cold" };
  }

  function loadStats() {
    try {
      return {
        played: 0,
        wins: 0,
        streak: 0,
        best: 0,
        ...JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"),
      };
    } catch {
      return { played: 0, wins: 0, streak: 0, best: 0 };
    }
  }

  function saveStats() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
    } catch {
      // Stats are nice to have; gameplay should continue when storage is blocked.
    }
  }

  function recordStats(won) {
    if (state.recorded) {
      return;
    }

    state.recorded = true;
    stats.played += 1;
    if (won) {
      stats.wins += 1;
      stats.streak += 1;
      const score = MAX_ATTEMPTS - state.attempts.length + 1;
      stats.best = Math.max(stats.best, score);
    } else {
      stats.streak = 0;
    }
    saveStats();
  }

  async function copyShareText() {
    const text = buildShareText();
    try {
      await navigator.clipboard.writeText(text);
      setFeedback("copy-check", "战绩已复制", "可以直接粘贴分享。");
    } catch {
      setFeedback("copy", "复制失败", text);
    }
  }

  function buildShareText() {
    const result = state.won ? `${state.attempts.length}/${MAX_ATTEMPTS}` : `X/${MAX_ATTEMPTS}`;
    const rows = state.attempts.map((attempt, index) => {
      const prefix = attempt.correct
        ? "OK"
        : `${Math.round(attempt.distance)}km ${bearingToArrowSymbol(attempt.bearing)}`;
      return `${index + 1}. ${attempt.city.name} ${prefix}`;
    });
    return [
      `天眼 ${cities.length} 城 ${state.mode === "daily" ? state.puzzleKey : "随机"}`,
      `成绩 ${result}`,
      ...rows,
      `答案 ${state.target.name}`,
    ].join("\n");
  }
})();
