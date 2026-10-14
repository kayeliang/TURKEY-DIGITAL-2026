(() => {
  const data = window.TRIP_DATA;
  const airportNamesByCode = Object.freeze({ MXP: "米兰马尔彭萨", IST: "伊斯坦布尔机场", TFU: "成都天府", URC: "乌鲁木齐地窝堡", SAW: "萨比哈·格克琴", ASR: "开塞利", AYT: "安塔利亚", PKX: "北京大兴", PEK: "北京首都", CTU: "成都双流" });
  const formatAirportText = (value = "") => {
    let text = String(value);
    if (text === "乌鲁木齐") text = "乌鲁木齐地窝堡 URC";
    if (text === "北京") text = "北京首都 PEK";
    text = text.replace("米兰 MXP", "米兰马尔彭萨 MXP").replace("伊斯坦布尔 IST", "伊斯坦布尔机场 IST").replace("成都天府 T2", "成都天府 TFU");
    text = text.replaceAll("Istanbul民宿", "Istanbul 民宿").replaceAll("Göreme民宿", "Göreme 民宿").replaceAll("Antalya民宿", "Antalya 民宿");
    return Object.entries(airportNamesByCode).reduce((current, [code, name]) => current.replace(new RegExp("\\b" + code + "\\b", "g"), (match, offset, whole) => whole.slice(Math.max(0, offset - name.length - 1), offset) === `${name} ` ? match : `${name} ${code}`), text);
  };
  const state = {
    page: localStorage.getItem("turkey-planner-page") || "home",
    selectedDate: localStorage.getItem("turkey-planner-date") || data.itinerary[0].date,
    bookingFilter: "all",
    expanded: new Set(),
    mapOpen: true,
    mapPlacesOpen: false,
    datePulse: null,
    dateFrom: null
  };
  if (state.page === "bookings") {
    state.page = "home";
    localStorage.setItem("turkey-planner-page", "home");
  }

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const escapeHtml = (value = "") => formatAirportText(value).replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char]));
  const formatDate = (iso, compact = false) => {
    const date = new Date(`${iso}T12:00:00`);
    return compact ? `${date.getMonth() + 1}/${date.getDate()}` : `${date.getMonth() + 1}月${date.getDate()}日`;
  };
  const weekday = (iso) => new Intl.DateTimeFormat("zh-CN", { weekday: "short" }).format(new Date(`${iso}T12:00:00`));
  const allById = (id) => [...data.flights, ...data.accommodations, ...data.activities, ...data.transports].find((item) => item.id === id);
  const mapsUrl = (query, placeId = "") => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}${placeId ? `&query_place_id=${encodeURIComponent(placeId)}` : ""}`;
  const mapLocations = Object.freeze({
    "HOTEL-001": { label: "Istanbul 民宿", lat: 41.034, lng: 28.977, kind: "stay" },
    "HOTEL-002": { label: "Göreme 民宿", lat: 38.643, lng: 34.828, kind: "stay" },
    "HOTEL-003": { label: "Antalya 民宿", lat: 36.887, lng: 30.704, kind: "stay" },
    "ACT-001": { label: "Highground Photography Scenic Overlook", mapQuery: "Highground Photography Scenic Overlook, İsali - Gaferli - Avcılar, 50180 Göreme/Nevşehir Merkez/Nevşehir, Türkiye", mapPlaceId: "ChIJ-atIoJpnKhURTFOwlLWrGS8", lat: 38.641, lng: 34.828, kind: "activity" },
    "ACT-002": { label: "Love Garden", lat: 38.650, lng: 34.835, kind: "activity" },
    "ACT-003": { label: "Uçhisar Castle", lat: 38.630, lng: 34.716, kind: "activity" },
    "ACT-004": { label: "Avanos Pottery Town", lat: 38.715, lng: 34.846, kind: "activity" },
    "ACT-005": { label: "Cappadocia rock formations", lat: 38.643, lng: 34.828, kind: "activity" },
    "ACT-006": { label: "Kaymaklı Underground City", lat: 38.459, lng: 34.752, kind: "activity" },
    "ACT-007": { label: "Lower Düden Waterfalls", lat: 36.852, lng: 30.789, kind: "activity" },
    "ACT-008": { label: "Hıdırlık Tower", lat: 36.881, lng: 30.704, kind: "activity" },
    "ACT-009": { label: "Hadrian's Gate", lat: 36.885, lng: 30.705, kind: "activity" },
    "ACT-010": { label: "Tekeli Mehmet Paşa Mosque", lat: 36.886, lng: 30.704, kind: "activity" },
    "ACT-011": { label: "Kaleiçi / Antalya Old Town", lat: 36.884, lng: 30.705, kind: "activity" },
    "ACT-012": { label: "Antalya coast", lat: 36.881, lng: 30.707, kind: "activity" },
    "ACT-013": { label: "Paddleboarding Antalya", lat: 36.875, lng: 30.715, kind: "activity" },
    "ACT-014": { label: "超市采购与做饭", lat: 36.887, lng: 30.704, kind: "activity" },
    "ACT-015": { label: "Aspendos Theatre", lat: 36.939, lng: 31.174, kind: "activity" },
    "ACT-016": { label: "Perge Ancient City", lat: 36.960, lng: 30.853, kind: "activity" },
    "ACT-017": { label: "Istanbul Airport shopping", lat: 41.276, lng: 28.730, kind: "activity" },
    "ACT-018": { label: "Istanbul", lat: 41.008, lng: 28.978, kind: "activity" },
    "ACT-019": { label: "Istanbul", lat: 41.008, lng: 28.978, kind: "activity" },
    "FLIGHT-001": { label: "米兰马尔彭萨 MXP", lat: 45.630, lng: 8.723, kind: "airport" },
    "FLIGHT-002": { label: "成都天府 TFU", lat: 30.312, lng: 104.441, kind: "airport" },
    "FLIGHT-003": { label: "乌鲁木齐地窝堡 URC", lat: 43.907, lng: 87.474, kind: "airport" },
    "FLIGHT-004": { label: "伊斯坦布尔机场 IST", lat: 41.276, lng: 28.730, kind: "airport" },
    "FLIGHT-005": { label: "北京大兴 PKX", lat: 39.509, lng: 116.410, kind: "airport" },
    "FLIGHT-006": { label: "北京首都 PEK", lat: 40.080, lng: 116.584, kind: "airport" },
    "FLIGHT-007": { label: "萨比哈·格克琴 SAW", lat: 40.898, lng: 29.309, kind: "airport" },
    "FLIGHT-008": { label: "开塞利 ASR", lat: 38.770, lng: 35.495, kind: "airport" },
    "FLIGHT-009": { label: "安塔利亚 AYT", lat: 36.899, lng: 30.800, kind: "airport" }
  });
  const mapMarkersForDay = (day) => (day?.eventRefs || []).map((id) => mapLocations[id] ? { ...mapLocations[id], id } : null).filter(Boolean);
  const mapMarkersForAllDestinations = () => [
    ...data.accommodations.map((item) => mapLocations[item.id] ? { ...mapLocations[item.id], id: item.id, label: item.name, mapQuery: item.address } : null),
    ...data.activities.filter((item) => item.mapQuery).map((item) => mapLocations[item.id] ? { ...mapLocations[item.id], id: item.id, label: item.title, mapQuery: item.mapQuery, mapPlaceId: item.mapPlaceId } : null)
  ].filter(Boolean);
  const locationQuery = (label) => {
    const normalizedLabel = String(label).replace(/\s+/g, "");
    const accommodation = data.accommodations.find((item) => item.name === label || item.area === label || String(item.name).replace(/\s+/g, "") === normalizedLabel || String(item.area).replace(/\s+/g, "") === normalizedLabel || (item.city === "Antalya" && normalizedLabel.includes("Antalya民宿")));
    return accommodation?.address || label;
  };
  const transportLocationLink = (label) => `<a class="transport-place-link" href="${mapsUrl(locationQuery(label))}" target="_blank" rel="noopener">${escapeHtml(label)} <span>${icon("pin")}</span></a>`;
  const statusClass = (status = "") => status.includes("已") || status.includes("完成") ? "ok" : status.includes("待") || status.includes("核实") || status.includes("完善") ? "warn" : status.includes("备选") || status.includes("历史") ? "muted" : "";
  const icon = (name) => name === "booking" ? '<span class="ticket-icon" aria-hidden="true"></span>' : ({ home: "⌂", route: "↗", guide: "ⓘ", plane: "✈", stay: "⌂", bus: "⇄", pin: "⌖", alert: "!", check: "✓", bag: "▰", arrow: "→", calendar: "□" }[name] || "•");

  function setPage(page) {
    state.page = page;
    localStorage.setItem("turkey-planner-page", page);
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function eventBlock(item) {
    const key = item.id;
    const open = state.expanded.has(key);
    const isActivity = item.id.startsWith("ACT");
    const isFlight = item.id.startsWith("FLIGHT");
    const isStay = item.id.startsWith("HOTEL");
    const tone = isActivity ? "activity" : isFlight ? "flight" : isStay ? "stay" : "transport";
    const title = item.title || item.flightNo || item.name || `${item.from} → ${item.to}`;
    const meta = isActivity ? `${item.timeLabel} · ${item.location}` : isFlight ? `${formatDate(item.date)} · ${item.traveler} · 当地时间` : isStay ? `${formatDate(item.checkIn)}—${formatDate(item.checkOut)} · ${item.nights}晚` : "交通详情";
    const detail = isActivity ? `<p>${escapeHtml(item.intro)}</p><div class="detail-grid"><span>来源</span><strong>${escapeHtml(item.source)}</strong><span>核实</span><strong>${escapeHtml(item.verificationStatus)}</strong></div>${item.notes ? `<p class="note">${icon("alert")} ${escapeHtml(item.notes)}</p>` : ""}${item.mapQuery ? `<a class="text-action" href="${mapsUrl(item.mapQuery, item.mapPlaceId)}" target="_blank" rel="noopener">${icon("pin")} 在 Google Maps 中打开</a>` : ""}` : isFlight ? `<div class="flight-route"><strong>${escapeHtml(item.from)}</strong><span>${escapeHtml(item.depart)} → ${escapeHtml(item.arrive)}</span><strong>${escapeHtml(item.to)}</strong></div><div class="detail-grid"><span>乘客</span><strong>${escapeHtml(item.traveler)}</strong><span>行李</span><strong>${escapeHtml(item.baggage)}</strong><span>来源</span><strong>${escapeHtml(item.source)}</strong></div>${item.notes ? `<p class="note">${icon("alert")} ${escapeHtml(item.notes)}</p>` : ""}` : isStay ? `<div class="detail-grid"><span>房东</span><strong>${escapeHtml(item.host)}</strong><span>入住</span><strong>${escapeHtml(item.checkInNote)}</strong><span>区域</span><strong>${escapeHtml(item.area)}</strong><span>地址</span><strong>${escapeHtml(item.address || "待补充")}</strong></div><p class="note">${icon("alert")} ${escapeHtml(item.notes)}</p>` : `<div class="detail-grid"><span>出发</span><strong>${transportLocationLink(item.from)}</strong><span>到达</span><strong>${transportLocationLink(item.to)}</strong><span>价格</span><strong>${escapeHtml(item.price || "未知")}${item.priceStatus && item.priceStatus !== "未知" ? ` · ${escapeHtml(item.priceStatus)}` : ""}</strong><span>核实</span><strong>${escapeHtml(item.verificationStatus)}</strong></div>${item.steps?.length ? `<div class="steps">${item.steps.map((step, i) => `<div class="step"><span class="step-no">${i + 1}</span><div><strong>${escapeHtml(step.line)}</strong><div>${transportLocationLink(step.from)} <span class="arrow">→</span> ${transportLocationLink(step.to)}</div>${step.price ? `<small>${escapeHtml(step.price)}</small>` : ""}${step.note ? `<p>${escapeHtml(step.note)}</p>` : ""}</div></div>`).join("")}</div>` : ""}<p class="note">${icon("alert")} ${escapeHtml(item.notes)}</p>`;
    return `<article class="timeline-item ${tone} ${open ? "is-open" : ""}"><div class="timeline-dot" aria-hidden="true">${isActivity ? icon("pin") : isFlight ? icon("plane") : isStay ? icon("stay") : icon("bus")}</div><div class="timeline-card"><button class="card-toggle" data-expand="${key}" aria-expanded="${open}"><span><small>${escapeHtml(meta)}</small><strong>${escapeHtml(title)}</strong></span><span class="card-chevron">${open ? "−" : "+"}</span></button><div class="card-summary">${isFlight ? `<span class="route-summary">${escapeHtml(item.fromCode)} ${item.depart} <b>→</b> ${escapeHtml(item.toCode)} ${item.arrive}</span>` : isStay ? `<span>${escapeHtml(item.host)} · ${escapeHtml(item.checkInNote)}</span>` : isActivity ? `<span>${escapeHtml(item.intro)}</span>` : `<span>${escapeHtml(item.mode)} · ${escapeHtml(item.status)}</span>`}<span class="status-chip ${statusClass(item.status)}">${escapeHtml(item.status)}</span></div>${open ? `<div class="card-detail">${detail}</div>` : ""}</div></article>`;
  }

  function dateSelector() {
    return `<div class="date-strip" role="tablist" aria-label="选择日期">${data.itinerary.map((day) => `<button class="date-tab ${day.date === state.selectedDate ? "active" : ""} ${day.date === state.datePulse && !state.dateFrom ? "is-popping" : ""} ${day.date === state.selectedDate && state.dateFrom && state.dateFrom !== state.selectedDate ? "is-selecting" : ""} ${day.date === state.dateFrom && state.dateFrom !== state.selectedDate ? "is-deselecting" : ""}" data-date="${day.date}" role="tab" aria-selected="${day.date === state.selectedDate}"><strong>${formatDate(day.date, true)}</strong><small>${weekday(day.date)}</small></button>`).join("")}</div>`;
  }

  function itineraryEvents(day) {
    // eventRefs is the intentional narrative order for the day. Do not sort by
    // per-entity order: transport and booking records need to stay interleaved.
    const refs = day.eventRefs || [];
    const entries = [];
    for (let index = 0; index < refs.length; index += 1) {
      const item = allById(refs[index]);
      if (!item) continue;
      if (item.id.startsWith("TRANS")) {
        const transportItems = [item];
        while (refs[index + 1] && refs[index + 1].startsWith("TRANS")) {
          const next = allById(refs[index + 1]);
          if (!next) break;
          transportItems.push(next);
          index += 1;
        }
        entries.push(transportItems.length === 1 ? transportItems[0] : mergeTransportItems(transportItems));
      } else {
        entries.push(item);
      }
    }
    return entries.map(eventBlock).join("");
  }

  function mergeTransportItems(items) {
    const hasPendingOrder = items.some((item) => item.status === "待补订单");
    const routeComplete = items.every((item) => item.status === "路线规划完成");
    const steps = items.flatMap((item) => item.steps?.length ? item.steps : [{ from: item.from, to: item.to, line: item.mode, price: item.price, note: item.notes }]);
    return {
      ...items[0],
      id: `TRANS-GROUP-${items[0].id}-${items[items.length - 1].id}`,
      title: `${items[0].from} → ${items[items.length - 1].to}`,
      title: items[0].displayTitle || `${items[0].from} → ${items[items.length - 1].to}`,
      mode: "多段交通过程",
      from: items[0].from,
      to: items[items.length - 1].to,
      status: hasPendingOrder ? "待补订单" : routeComplete ? "路线规划完成" : "已计划",
      price: null,
      priceStatus: "多段参考",
      source: items.map((item) => item.source).filter(Boolean).filter((source, index, sources) => sources.indexOf(source) === index).join("；"),
      verificationStatus: items.some((item) => item.verificationStatus === "待核实") ? "部分待核实" : items[0].verificationStatus,
      steps,
      notes: "多个换乘点已合并在同一个交通过程内；换乘点和中转站不作为目的地板块显示。"
    };
  }

  function homePage() {
    const homeBookings = `<section class='home-bookings'><div class='section-heading'><h2>预订</h2><span class='muted-text'>${data.flights.length} 个航班 · ${data.accommodations.length} 个住宿</span></div><div class='booking-list home-booking-list'>${data.flights.map((item) => bookingCard(item, 'flight')).join('')}${data.accommodations.map((item) => bookingCard(item, 'stay')).join('')}</div></section>`;
    return `<section class='page home-page'><div class='hero-copy'><div class='eyebrow'>${icon('calendar')} 2026 TRIP · ${data.trip.travelers.join(' + ')}</div><h1>${escapeHtml(data.trip.title)} <span aria-label='土耳其国旗'>🇹🇷</span></h1><p class='subhead'>${escapeHtml(data.trip.subtitle)}</p></div><div class='overview-card'><div><span class='overline'>旅行概览</span><strong>7 晚 · 3 个目的地</strong></div><div class='destination-row'>${data.trip.destinations.map((destination, i) => `<span><i>${i + 1}</i>${escapeHtml(destination)}</span>`).join('')}</div></div>${homeBookings}</section>`;
    const homeMap = "";
    return `<section class="page home-page"><div class="hero-copy"><div class="eyebrow">${icon("calendar")} 2026 TRIP · ${data.trip.travelers.join(" + ")}</div><h1>${escapeHtml(data.trip.title)} <span aria-label="土耳其国旗">🇹🇷</span></h1><p class="subhead">${escapeHtml(data.trip.subtitle)}</p></div><div class="overview-card"><div><span class="overline">旅行概览</span><strong>7 晚 · 3 个目的地</strong></div><div class="destination-row">${data.trip.destinations.map((destination, i) => `<span><i>${i + 1}</i>${escapeHtml(destination)}</span>`).join("")}</div></div><div class="notice-card"><span class="notice-icon">${icon("alert")}</span><div><strong>11 月 7 日时间压力较高</strong><p>Avanos 回程、机场接驳与 22:25 的 PC3503 需要预留缓冲。</p></div></div>${homeMap}<div class="quick-actions"><button data-page="itinerary">${icon("route")} 完整行程</button><button data-page="bookings">${icon("booking")} 预订与凭证</button></div></section>`;
    const nextFlight = data.flights.find((flight) => ["2026-11-03", "2026-11-06", "2026-11-07", "2026-11-10"].includes(flight.date));
    const pending = ["TRANS-001", "TRANS-003", "TRANS-004", "TRANS-017", "HOTEL-001"].map(allById).filter(Boolean);
return `<section class="page home-page"><div class="hero-copy"><div class="eyebrow">${icon("calendar")} 2026 TRIP · ${data.trip.travelers.join(" + ")}</div><h1>${escapeHtml(data.trip.title)} <span aria-label="土耳其国旗">🇹🇷</span></h1><p class="subhead">${escapeHtml(data.trip.subtitle)}</p></div><div class="overview-card"><div><span class="overline">旅行概览</span><strong>7 晚 · 3 个目的地</strong></div><div class="destination-row">${data.trip.destinations.map((destination, i) => `<span><i>${i + 1}</i>${escapeHtml(destination)}</span>`).join("")}</div></div><div class="section-heading"><h2>接下来</h2><button class="link-button" data-page="itinerary">查看行程 ${icon("arrow")}</button></div><div class="next-card"><div class="next-icon">${icon("plane")}</div><div><span class="overline">${formatDate(nextFlight.date)} · ${nextFlight.flightNo}</span><strong>${escapeHtml(nextFlight.from)} <em>→</em> ${escapeHtml(nextFlight.to)}</strong><small>${nextFlight.depart} 出发 · ${nextFlight.status}</small></div></div><div class="notice-card"><span class="notice-icon">${icon("alert")}</span><div><strong>11 月 7 日时间压力较高</strong><p>Avanos 回程、机场接驳与 22:25 的 PC3503 需要预留缓冲。</p></div></div><div class="section-heading"><h2>待处理</h2><span class="muted-text">${pending.length} 项</span></div><div class="pending-list">${pending.map((item) => `<button class="pending-row" data-page="${item.id.startsWith("HOTEL") ? "bookings" : "itinerary"}" data-target="${item.id}"><span>${item.id.startsWith("HOTEL") ? icon("stay") : icon("bus")}</span><strong>${escapeHtml(item.title || item.name || `${item.from} → ${item.to}`)}</strong><small>${item.status || "待补充"}</small><b>›</b></button>`).join("")}</div><div class="quick-actions"><button data-page="itinerary">${icon("route")} 完整行程</button><button data-page="bookings">${icon("booking")} 预订与凭证</button></div></section>`;
  }

  function mapPage() {
    const destinationMarkers = mapMarkersForAllDestinations();
    return `<section class='page map-page map-fullscreen-page'><div class='map-fullscreen-head'><strong>所有目的地</strong><span>${destinationMarkers.length} 个红色目的地 · 可缩放、拖动、点击</span></div><div class='day-map map-fullscreen-canvas' data-map-scope='all-destinations' aria-label='所有目的地全屏地图'></div></section>`;
    return `<section class="page map-page"><div class="page-heading"><div><span class="eyebrow">DESTINATIONS MAP</span><h1>地图</h1></div><span class="date-badge">${destinationMarkers.length} 个目的地</span></div><section class="map-panel home-destination-map"><div class="map-panel-toggle"><span><b>${icon("pin")}</b><span><strong>所有目的地</strong><small>红色标记 · 可缩放、拖动、点击查看地点</small></span></span><span>地图</span></div><div class="day-map" data-map-scope="all-destinations" aria-label="所有目的地地图"></div></section></section>`;
  }

  function itineraryPage() {
    const day = data.itinerary.find((item) => item.date === state.selectedDate) || data.itinerary[0];
    const places = (day.eventRefs || []).map(allById).filter((item) => item?.mapQuery);
    const mapMarkers = mapMarkersForDay(day);
    const placeDirectory = `<div class="map-directory ${state.mapPlacesOpen ? "open" : ""}"><button class="map-directory-toggle" data-map-places-toggle aria-expanded="${state.mapPlacesOpen}"><span><strong>地点目录</strong><small>${places.length ? `${places.length} 个可导航地点` : "暂无可导航地点"}</small></span><span>${state.mapPlacesOpen ? "收起 −" : "展开 +"}</span></button>${state.mapPlacesOpen ? `<div class="map-place-list">${places.map((place, index) => `<div class="map-place"><span class="map-index">${index + 1}</span><div><strong>${escapeHtml(place.title || place.name)}</strong><small>${escapeHtml(place.location || place.to || "地点")}</small></div><a href="${mapsUrl(place.mapQuery, place.mapPlaceId)}" target="_blank" rel="noopener">${icon("pin")} 导航</a></div>`).join("") || `<div class="map-empty">今天没有可导航地点。交通与住宿仍可在时间线中展开查看。</div>`}</div>` : ""}</div>`;
    const mapPanel = `<section class="map-panel ${state.mapOpen ? "open" : ""}"><button class="map-panel-toggle" data-map-toggle aria-expanded="${state.mapOpen}"><span><b>${icon("pin")}</b><span><strong>当天地点</strong><small>${mapMarkers.length ? `${mapMarkers.length} 个地图标记 · 可缩放、拖动、点击` : "暂无已定位地点"}</small></span></span><span>${state.mapOpen ? "收起" : "展开"} ${state.mapOpen ? "−" : "+"}</span></button>${state.mapOpen ? `<div class="day-map" data-map-date="${day.date}" aria-label="${escapeHtml(day.city)} 可交互地图"></div>${placeDirectory}` : ""}</section>`;
return `<section class="page itinerary-page"><div class="page-heading"><div><span class="eyebrow">DAILY PLAN</span><h1>行程</h1></div><span class="date-badge">${formatDate(day.date)}</span></div>${dateSelector()}<div class="day-intro"><div><span class="eyebrow">${escapeHtml(day.city)}</span><h2>${escapeHtml(day.label)}</h2><p>${escapeHtml(day.summary)}</p></div></div>${mapPanel}<div class="timeline">${itineraryEvents(day) || `<div class="empty-state"><strong>这一天还没有安排</strong><p>可以从这里继续添加活动；当前没有虚构未确认行程。</p></div>`}</div></section>`;
  }

  function bookingCard(item, type) {
    const isFlight = type === "flight";
    const isStay = type === "stay";
    return `<article class="booking-card ${type}"><div class="booking-card-top"><span class="booking-icon">${isFlight ? icon("plane") : icon("stay")}</span><div><span class="overline">${isFlight ? formatDate(item.date) + " · " + item.flightNo + " · 当地时间" : item.city}</span><h3>${escapeHtml(isFlight ? `${item.fromCode} → ${item.toCode}` : item.name)}</h3><p>${escapeHtml(isFlight ? item.traveler : `${item.host} · ${formatDate(item.checkIn)}—${formatDate(item.checkOut)}`)}</p></div><span class="status-chip ok">${escapeHtml(item.status)}</span></div>${isFlight ? `<div class="booking-route"><strong>${item.depart}</strong><span>→</span><strong>${item.arrive}</strong></div><div class="booking-meta"><span>${escapeHtml(item.from)}</span><span>${escapeHtml(item.to)}</span></div><p class="booking-foot">${icon("bag")} ${escapeHtml(item.baggage)}</p>` : `<div class="booking-meta stay-meta"><span>入住 ${formatDate(item.checkIn)}</span><span>退房 ${formatDate(item.checkOut)}</span><span>${item.nights} 晚</span></div><p class="booking-foot">${icon("pin")} ${escapeHtml(item.address || item.area)} · 入住 ${escapeHtml(item.checkInNote)} <a class="text-action" href="${mapsUrl(item.address || item.area)}" target="_blank" rel="noopener">打开地图</a></p>`}<details class="source-details"><summary>来源与缺失信息</summary><p>${escapeHtml(item.source)}</p><p>${escapeHtml(item.notes || "无额外备注")}</p></details></article>`;
  }

  function bookingsPage() {
    const flights = data.flights.filter((item) => state.bookingFilter === "all" || state.bookingFilter === "flight");
    const stays = data.accommodations.filter((item) => state.bookingFilter === "all" || state.bookingFilter === "stay");
    const transfers = data.transports.filter((item) => state.bookingFilter === "all" || state.bookingFilter === "transfer").filter((item) => ["TRANS-001", "TRANS-003", "TRANS-004", "TRANS-005", "TRANS-007", "TRANS-017"].includes(item.id));
    return `<section class="page bookings-page"><div class="page-heading"><div><span class="eyebrow">RESERVATIONS</span><h1>预订</h1></div><span class="date-badge">${data.flights.length + data.accommodations.length} 已确定</span></div><div class="filter-strip" role="tablist">${[["all", "全部"], ["flight", "航班"], ["stay", "住宿"], ["transfer", "接驳"]].map(([key, label]) => `<button class="filter-pill ${state.bookingFilter === key ? "active" : ""}" data-filter="${key}" role="tab" aria-selected="${state.bookingFilter === key}">${label}</button>`).join("")}</div><div class="booking-list">${flights.map((item) => bookingCard(item, "flight")).join("")}${stays.map((item) => bookingCard(item, "stay")).join("")}${transfers.length ? `<div class="list-label">交通接驳 · 订单状态独立记录</div>${transfers.map((item) => `<article class="transfer-booking"><div><span class="booking-icon">${icon("bus")}</span><div><span class="overline">${formatDate(item.date)} · ${escapeHtml(item.mode)}</span><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.from)} → ${escapeHtml(item.to)}</p></div></div><span class="status-chip ${statusClass(item.status)}">${escapeHtml(item.status)}</span><p>${escapeHtml(item.notes)}</p></article>`).join("")}` : ""}</div></section>`;
  }

  function guidePage() {
    return `<section class="page guide-page"><div class="page-heading"><div><span class="eyebrow">QUICK REFERENCE</span><h1>指南</h1></div><span class="date-badge">${data.trip.dateStart.slice(0, 7).replace("-", ".")}</span></div><div class="guide-grid"><article class="guide-card"><span class="guide-number">01</span><h2>日期与城市</h2><p>${formatDate(data.trip.dateStart)}—${formatDate(data.trip.dateEnd)} · ${data.trip.destinations.join(" · ")}</p></article><article class="guide-card"><span class="guide-number">02</span><h2>行李</h2><p>所有航班：每人 15 kg 托运行李。手提行李限制不在本版追踪范围。</p></article><article class="guide-card"><span class="guide-number">03</span><h2>重点提醒</h2><ul><li>11/07：PC3503 22:25 从 ASR 起飞。</li><li>11/08：深夜 600G 进城，最后一段路线待核实。</li><li>11/10：两人的返程航班相差 5 分钟。</li></ul></article><article class="guide-card"><span class="guide-number">04</span><h2>数据可信度</h2><p>参考票价、历史报价、路线规划与已出票状态分开记录；路线规划完成不代表实际乘坐。</p></article></div><div class="accordion-list"><details open><summary>待补充信息 <span>4 项</span></summary><div class="accordion-content"><p>格雷梅往返 ASR 接驳凭证与接送时间、11/03 机场进城方式、酒店部分订单字段、景点门票与餐饮预算。</p></div></details><details><summary>已记录的交通方案 <span>TRANS-001—026</span></summary><div class="accordion-content"><p>行程页中的交通卡片保留出发点、到达点、线路、参考价格、来源和需要现场确认的事项。</p></div></details><details><summary>数据来源说明</summary><div class="accordion-content"><p>${escapeHtml(data.trip.source)}。${escapeHtml(data.trip.notes)}</p></div></details></div><div class="data-footnote">${icon("check")} 核心数据刷新后仍来自同一份旅行数据层</div></section>`;
  }

  function navBar() {
    const items = [["home", "首页", "home"], ["itinerary", "行程", "route"], ["map", "地图", "pin"]];
    return `<nav class="bottom-nav" aria-label="主导航">${items.map(([page, label, glyph]) => `<button class="nav-item ${state.page === page ? "active" : ""}" data-page="${page}" aria-current="${state.page === page ? "page" : "false"}"><span class="nav-icon">${icon(glyph)}</span><span>${label}</span></button>`).join("")}</nav>`;
  }

  function render() {
    const content = state.page === "itinerary" ? itineraryPage() : state.page === "bookings" ? bookingsPage() : state.page === "map" ? mapPage() : homePage();
    $("#app").innerHTML = `<main class="app-main">${content}</main>${navBar()}`;
    bindEvents();
    initInteractiveMaps();
  }

  function initInteractiveMaps() {
    $$(".day-map").forEach((element) => {
      if (!window.L) {
        element.innerHTML = `<div class="map-empty">交互地图加载中；如果网络受限，可使用下方地点的 Google Maps 按钮。</div>`;
        return;
      }
      const day = data.itinerary.find((item) => item.date === element.dataset.mapDate);
      const isAllDestinationsMap = element.dataset.mapScope === "all-destinations";
      const markers = isAllDestinationsMap ? mapMarkersForAllDestinations() : mapMarkersForDay(day);
      const map = window.L.map(element, { zoomControl: true, scrollWheelZoom: true, tap: true });
      window.L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "© OpenStreetMap contributors"
      }).addTo(map);
      const points = markers.map((marker) => [marker.lat, marker.lng]);
      markers.forEach((marker) => {
        const color = isAllDestinationsMap || marker.kind === "stay" ? "#850000" : marker.kind === "airport" ? "#00538a" : "#d39a29";
        const pin = window.L.circleMarker([marker.lat, marker.lng], { radius: 9, color: "#fff", weight: 2, fillColor: color, fillOpacity: 1 }).addTo(map);
        pin.bindTooltip(escapeHtml(marker.label), { permanent: true, direction: "right", offset: [9, 0], className: "map-marker-label" });
        pin.bindPopup(`<strong>${escapeHtml(marker.label)}</strong><br><a href="${escapeHtml(mapsUrl(marker.mapQuery || marker.label, marker.mapPlaceId))}" target="_blank" rel="noopener">在 Google Maps 中打开</a>`);
      });
      if (points.length === 1) map.setView(points[0], 13);
      else if (points.length > 1) map.fitBounds(window.L.latLngBounds(points), { padding: [24, 24], maxZoom: 12 });
      else map.setView([39, 35], 5);
      window.setTimeout(() => map.invalidateSize(), 0);
    });
  }

  function bindEvents() {
    $$('[data-page]').forEach((button) => button.addEventListener("click", () => setPage(button.dataset.page)));
    $$('[data-date]').forEach((button) => button.addEventListener("click", () => {
      state.dateFrom = state.selectedDate === button.dataset.date ? null : state.selectedDate;
      state.selectedDate = button.dataset.date;
      state.datePulse = button.dataset.date;
      localStorage.setItem("turkey-planner-date", state.selectedDate);
      render();
      window.setTimeout(() => {
        if (state.datePulse !== button.dataset.date) return;
        state.datePulse = null;
        state.dateFrom = null;
        const currentButton = document.querySelector(`[data-date="${button.dataset.date}"]`);
        currentButton?.classList.remove("is-popping");
      }, 460);
    }));
    $$('[data-filter]').forEach((button) => button.addEventListener("click", () => {
      state.bookingFilter = button.dataset.filter;
      render();
    }));
    $$('[data-expand]').forEach((button) => button.addEventListener("click", () => {
      const key = button.dataset.expand;
      state.expanded.has(key) ? state.expanded.delete(key) : state.expanded.add(key);
      render();
    }));
    $$('[data-map-toggle]').forEach((button) => button.addEventListener("click", () => {
      state.mapOpen = !state.mapOpen;
      render();
    }));
    $$('[data-map-places-toggle]').forEach((button) => button.addEventListener("click", () => {
      state.mapPlacesOpen = !state.mapPlacesOpen;
      render();
    }));
  }

  render();
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("./service-worker.js").catch(() => {});
})();
