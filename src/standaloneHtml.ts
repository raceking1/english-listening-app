/**
 * Standalone single HTML file generator
 * Generates a completely self-contained single index.html file with embedded CSS and JS,
 * including female/male voice alternation, full repeat loop, mobile touch optimization,
 * screen-off background audio playback via MediaSession & silent carrier, and daily study log persistence.
 */

export function generateStandaloneHtml(
  initialText: string,
  repeatCount = 3,
  pauseSeconds = 1,
  rate = 1.0,
  initialFullLoop = true,
  initialVoiceMode = 'alternate'
): string {
  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
  <meta name="referrer" content="no-referrer" />
  <title>영어 문장 반복 청취 & 대형 자막 (날짜별 저장 & 화면꺼짐 재생)</title>
  <style>
    /* =========================================================
       [디자인 및 스타일]
       모바일 & PC 반응형, 부드러운 파스텔/슬레이트 테마, 터치 친화적 UI
       ========================================================= */
    :root {
      --bg-color: #f8fafc;
      --card-bg: #ffffff;
      --primary: #4f46e5;
      --primary-hover: #4338ca;
      --primary-light: #e0e7ff;
      --text-main: #0f172a;
      --text-muted: #64748b;
      --border-color: #e2e8f0;
      --safe-bottom: env(safe-area-inset-bottom, 16px);
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-tap-highlight-color: transparent;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      background-color: var(--bg-color);
      color: var(--text-main);
      line-height: 1.6;
      padding: 16px 12px calc(80px + var(--safe-bottom)) 12px;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    @media (min-width: 640px) {
      body {
        padding: 24px 16px 40px 16px;
      }
    }

    .container {
      width: 100%;
      max-width: 900px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    /* 헤더 */
    header {
      text-align: center;
      margin-bottom: 4px;
    }

    header h1 {
      font-size: 1.45rem;
      font-weight: 800;
      color: #1e1b4b;
      letter-spacing: -0.02em;
    }

    header p {
      color: var(--text-muted);
      font-size: 0.85rem;
      margin-top: 2px;
    }

    @media (min-width: 640px) {
      header h1 { font-size: 1.75rem; }
      header p { font-size: 0.95rem; }
    }

    /* 공통 카드 */
    .card {
      background: var(--card-bg);
      border-radius: 16px;
      border: 1px solid var(--border-color);
      padding: 16px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
    }

    @media (min-width: 640px) {
      .card { padding: 24px; }
    }

    /* 대형 자막 디스플레이 영역 */
    .subtitle-stage {
      background: linear-gradient(145deg, #0f172a 0%, #1e1b4b 100%);
      color: #ffffff;
      border-radius: 20px;
      padding: 24px 16px;
      text-align: center;
      min-height: 190px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.3);
      position: relative;
    }

    @media (min-width: 640px) {
      .subtitle-stage {
        padding: 32px 24px;
        min-height: 230px;
      }
    }

    .subtitle-meta {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      align-items: center;
      gap: 8px;
      font-size: 0.8rem;
      font-weight: 600;
      color: #94a3b8;
      margin-bottom: 12px;
    }

    .subtitle-meta span {
      background: rgba(255, 255, 255, 0.12);
      padding: 4px 10px;
      border-radius: 8px;
    }

    .gender-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-weight: 700;
      padding: 4px 12px !important;
      border-radius: 20px !important;
      transition: all 0.2s ease;
    }

    .gender-female {
      background: rgba(244, 63, 94, 0.2) !important;
      color: #fda4af !important;
      border: 1px solid rgba(244, 63, 94, 0.4);
    }

    .gender-male {
      background: rgba(56, 189, 248, 0.2) !important;
      color: #7dd3fc !important;
      border: 1px solid rgba(56, 189, 248, 0.4);
    }

    .subtitle-text {
      font-size: 1.45rem;
      font-weight: 700;
      line-height: 1.45;
      color: #f8fafc;
      max-width: 780px;
      word-break: keep-all;
      margin: 8px 0;
      user-select: text;
    }

    @media (min-width: 640px) {
      .subtitle-text { font-size: 1.85rem; }
    }

    .subtitle-text.waiting {
      color: #94a3b8;
      font-size: 1.1rem;
      font-weight: 500;
    }

    .pause-indicator {
      margin-top: 8px;
      font-size: 0.85rem;
      color: #38bdf8;
      font-weight: 600;
      display: none;
    }

    /* 설정 폼 그리드 */
    .settings-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 12px;
      margin-top: 14px;
    }

    @media (min-width: 640px) {
      .settings-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 16px;
      }
    }

    @media (min-width: 860px) {
      .settings-grid {
        grid-template-columns: repeat(4, 1fr);
      }
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .form-group label {
      font-size: 0.8rem;
      font-weight: 700;
      color: #334155;
      display: flex;
      justify-content: space-between;
    }

    .form-group input, .form-group select, .form-group textarea {
      padding: 10px 12px;
      border-radius: 10px;
      border: 1px solid var(--border-color);
      font-size: 0.95rem;
      font-family: inherit;
      color: var(--text-main);
      background-color: #ffffff;
      outline: none;
      min-height: 44px;
    }

    textarea {
      min-height: 120px;
      resize: vertical;
      line-height: 1.5;
    }

    /* 버튼 공통 */
    button {
      cursor: pointer;
      font-family: inherit;
      font-weight: 600;
      border: none;
      border-radius: 12px;
      padding: 10px 16px;
      font-size: 0.95rem;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      min-height: 44px;
      touch-action: manipulation;
      transition: all 0.15s ease;
    }

    button:active {
      transform: scale(0.98);
    }

    .btn-primary { background: var(--primary); color: white; }
    .btn-primary:hover { background: var(--primary-hover); }
    .btn-secondary { background: #e2e8f0; color: #334155; }
    .btn-secondary:hover { background: #cbd5e1; }
    .btn-danger { background: #fee2e2; color: #991b1b; }
    .btn-danger:hover { background: #fecaca; }

    .toggle-active {
      background: #e0e7ff !important;
      color: #4338ca !important;
      border: 1px solid #c7d2fe !important;
      font-weight: 700 !important;
    }

    /* 문장 리스트 */
    .sentence-list {
      max-height: 320px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-top: 10px;
    }

    .sentence-item {
      padding: 12px 14px;
      border-radius: 12px;
      border: 1px solid var(--border-color);
      background: #f8fafc;
      font-size: 0.9rem;
      display: flex;
      align-items: baseline;
      gap: 10px;
      cursor: pointer;
      min-height: 48px;
    }

    .sentence-item.active {
      background: #eff6ff;
      border-color: #3b82f6;
      color: #1e3a8a;
      font-weight: 700;
      box-shadow: 0 2px 6px rgba(59, 130, 246, 0.15);
    }

    .sentence-num {
      font-size: 0.8rem;
      color: #64748b;
      min-width: 24px;
      font-weight: 700;
    }

    .sentence-item.active .sentence-num {
      color: #2563eb;
    }

    /* 모달 공통 */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.6);
      backdrop-filter: blur(4px);
      z-index: 1000;
      display: none;
      align-items: center;
      justify-content: center;
      padding: 16px;
    }

    .modal-content {
      background: #ffffff;
      border-radius: 20px;
      max-width: 650px;
      width: 100%;
      max-height: 85vh;
      display: flex;
      flex-direction: column;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2);
      overflow: hidden;
    }

    .modal-header {
      padding: 16px 20px;
      border-bottom: 1px solid var(--border-color);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .modal-body {
      padding: 16px 20px;
      overflow-y: auto;
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .modal-footer {
      padding: 12px 20px;
      border-top: 1px solid var(--border-color);
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      background: #f8fafc;
    }

    /* 히스토리 항목 카드 */
    .history-card {
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 12px 14px;
      background: #ffffff;
      display: flex;
      flex-direction: column;
      gap: 6px;
      transition: all 0.15s ease;
    }

    .history-card:hover {
      border-color: #cbd5e1;
      background: #f8fafc;
    }

    /* 모바일 하단 제어 바 */
    .mobile-bottom-bar {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      border-top: 1px solid var(--border-color);
      padding: 10px 16px calc(10px + var(--safe-bottom)) 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      z-index: 999;
      box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.06);
    }

    @media (min-width: 640px) {
      .mobile-bottom-bar { display: none; }
    }

    .mobile-bottom-bar button {
      flex: 1;
      padding: 8px 6px;
      font-size: 0.8rem;
      min-height: 44px;
    }
  </style>
</head>
<body>

  <div class="container">
    <!-- 헤더 -->
    <header>
      <h1>영어 문장 반복 청취 & 대형 자막</h1>
      <p>👩 여성 ↔ 👨 남성 교차 음성 · 날짜별 공부 저장 · 스마트폰 화면꺼짐 재생</p>
    </header>

    <!-- [대형 자막 디스플레이] -->
    <section class="subtitle-stage">
      <div class="subtitle-meta">
        <span id="labelSentence">문장: 0 / 0</span>
        <span id="labelRepeat">반복: 0 / 0</span>
        <span id="genderBadge" class="gender-badge gender-female">👩 여성 음성</span>
        <span id="labelLoop">전체반복: ${initialFullLoop ? 'ON' : 'OFF'}</span>
        <span id="labelSpeed">${rate.toFixed(1)}x</span>
      </div>
      <div class="subtitle-text waiting" id="subtitleText">
        '학습 시작'을 누르면 여자/남자 음성이 번갈아가며 재생됩니다.
      </div>
      <div class="pause-indicator" id="pauseIndicator">
        문장 간 대기 중...
      </div>
    </section>

    <!-- [PC용 상단 제어 바] -->
    <div class="controls-toolbar card" style="display: flex; flex-wrap: wrap; gap: 8px; align-items: center;">
      <button id="btnStart" class="btn-primary" style="flex: 2; min-width: 130px;">▶ 학습 시작</button>
      <button id="btnPause" class="btn-secondary" style="flex: 1; min-width: 90px;" disabled>⏸ 일시정지</button>
      <button id="btnResume" class="btn-secondary" style="flex: 1; min-width: 90px; display: none;">▶ 재개</button>
      <button id="btnStop" class="btn-danger" style="flex: 1; min-width: 90px;" disabled>⏹ 정지</button>

      <button id="btnVoiceToggle" class="btn-secondary toggle-active" style="flex: 1.5; min-width: 130px;">
        👥 음성: <span id="voiceModeText">남녀 교차</span>
      </button>

      <button id="btnLoopToggle" class="btn-secondary ${initialFullLoop ? 'toggle-active' : ''}" style="flex: 1.5; min-width: 110px;">
        🔁 전체 반복: <span id="loopStatusText">${initialFullLoop ? 'ON' : 'OFF'}</span>
      </button>

      <!-- 표준 HTML <audio> 화면꺼짐·앱전환 연속 재생 전환 버튼 -->
      <button id="btnEngineToggle" class="btn-secondary toggle-active" style="flex: 1.6; min-width: 150px;" title="표준 HTML <audio> 백그라운드 연속 재생과 기기 내장 음성을 전환합니다">
        🎵 <span id="engineToggleText">HTML 오디오(화면꺼짐 지원)</span>
      </button>

      <!-- 🌙 주머니 절전 모드 -->
      <button id="btnPocketModeToggle" class="btn-secondary" style="flex: 1.5; min-width: 140px; background:#0f172a; color:#818cf8; border-color:#334155;" title="화면을 완전 블랙으로 전환하고 터치를 잠급니다 (OLED 배터리 0% 소모)">
        🌙 주머니 절전 모드
      </button>

      <!-- 날짜별 학습 기록 버튼 -->
      <button id="btnOpenHistory" class="btn-secondary" style="flex: 1.5; min-width: 130px;">
        📅 날짜별 기록 (<span id="historyCount">0</span>)
      </button>

      <button id="btnSaveToday" class="btn-secondary" style="flex: 1.2; min-width: 110px;" title="현재 문장을 오늘 날짜의 학습 노트로 저장합니다">
        💾 오늘 저장
      </button>

      <button id="btnPrev" class="btn-secondary" style="flex: 1; min-width: 70px;" disabled>⏮ 이전</button>
      <button id="btnNext" class="btn-secondary" style="flex: 1; min-width: 70px;" disabled>⏭ 다음</button>
    </div>

    <!-- [설정 및 텍스트 입력 영역] -->
    <section class="card">
      <div class="form-group">
        <label for="textInput">학습할 영어 문장 (마침표 ., 물음표 ?, 느낌표 ! 단위 자동 분리)</label>
        <textarea id="textInput" placeholder="영어 문장을 입력하세요...">${initialText.replace(/`/g, '\\`')}</textarea>
      </div>

      <!-- 세부 설정 그리드 -->
      <div class="settings-grid">
        <div class="form-group">
          <label for="inputRepeat">문장별 반복 횟수 <strong id="valRepeat" style="color: var(--primary);">${repeatCount}회</strong></label>
          <input type="number" id="inputRepeat" min="1" max="10" value="${repeatCount}">
        </div>

        <div class="form-group">
          <label for="inputPause">문장 간 쉬는 시간 <strong id="valPause" style="color: var(--primary);">${pauseSeconds}초</strong></label>
          <input type="number" id="inputPause" min="0" max="10" step="0.5" value="${pauseSeconds}">
        </div>

        <div class="form-group">
          <label for="inputRate">읽기 속도 <strong id="valRate" style="color: var(--primary);">${rate.toFixed(1)}x</strong></label>
          <input type="range" id="inputRate" min="0.5" max="2.0" step="0.1" value="${rate}">
        </div>

        <div class="form-group">
          <label for="selectVoiceMode">음성 재생 방식</label>
          <select id="selectVoiceMode">
            <option value="alternate" ${initialVoiceMode === 'alternate' ? 'selected' : ''}>남/녀 음성 번갈아 교차 (추천)</option>
            <option value="custom" ${initialVoiceMode === 'custom' ? 'selected' : ''}>선택한 영어 음성 고정</option>
            <option value="female-only" ${initialVoiceMode === 'female-only' ? 'selected' : ''}>여성 음성만 사용</option>
            <option value="male-only" ${initialVoiceMode === 'male-only' ? 'selected' : ''}>남성 음성만 사용</option>
          </select>
        </div>
      </div>

      <!-- 영어 음성 선택 드롭다운 -->
      <div style="margin-top: 14px; padding-top: 14px; border-top: 1px solid var(--border-color);">
        <div style="display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 6px;">
          <label for="selectEnglishVoice" style="margin-bottom: 0; display: flex; align-items: center; gap: 6px;">
            🗣️ 영어 음성 선택
            <span id="voiceCountBadge" style="font-size: 0.72rem; font-weight: 700; color: var(--primary); background: var(--primary-light); padding: 2px 8px; border-radius: 999px;">0개 로드됨</span>
          </label>
          <div style="display: flex; gap: 6px;">
            <button type="button" id="btnPreviewVoice" class="btn-secondary" style="min-height: 36px; padding: 6px 12px; font-size: 0.78rem;">🔊 미리듣기</button>
            <button type="button" id="btnRefreshVoices" class="btn-secondary" style="min-height: 36px; padding: 6px 12px; font-size: 0.78rem;">🔄 새로고침</button>
          </div>
        </div>
        <select id="selectEnglishVoice" style="width: 100%; min-height: 44px;">
          <option value="">기기의 영어 음성 목록을 불러오는 중...</option>
        </select>
        <p style="font-size: 0.75rem; color: var(--text-muted); margin-top: 6px;">
          다른 영어 음성을 선택하면 다음 재생부터 즉시 선택한 목소리로 읽어줍니다.
        </p>
      </div>
    </section>

    <!-- [문장 목록 영역] -->
    <section class="card">
      <h3 style="font-size: 0.95rem; font-weight: 700; margin-bottom: 6px;">문장 리스트 (터치 시 해당 문장 즉시 재생)</h3>
      <div class="sentence-list" id="sentenceList"></div>
    </section>
  </div>

  <!-- [스마트폰 하단 고정 제어 바] -->
  <div class="mobile-bottom-bar">
    <button id="btnMobilePrev" class="btn-secondary" disabled>⏮</button>
    <button id="btnMobilePlay" class="btn-primary">▶ 시작</button>
    <button id="btnMobileNext" class="btn-secondary" disabled>⏭</button>
    <button id="btnMobileVoice" class="btn-secondary toggle-active">👥 남녀</button>
    <button id="btnMobilePocket" class="btn-secondary toggle-active" style="background:#0f172a;color:#818cf8;border-color:#334155;">🌙 주머니</button>
    <button id="btnMobileHistory" class="btn-secondary">📅 기록</button>
  </div>

  <!-- [OLED 주머니 절전 암전 모드 오버레이] -->
  <div id="pocketModeOverlay" style="display:none; position:fixed; inset:0; z-index:99999; background:#000000; color:#ffffff; flex-direction:column; justify-content:space-between; padding:24px; user-select:none; touch-action:none;">
    <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.75rem; color:#64748b;">
      <span style="color:#10b981; font-weight:700;">● 주머니 절전 암전 모드 (OLED 전력 0%)</span>
      <span id="pocketClock" style="font-family:monospace; color:#94a3b8;">12:00</span>
    </div>
    <div style="display:flex; flex-direction:column; align-items:center; text-align:center; gap:16px; margin:auto 0;">
      <div style="font-size:2.5rem;">🌙</div>
      <div id="pocketSentenceInfo" style="font-size:0.85rem; font-weight:700; color:#818cf8;">문장 학습 진행 중...</div>
      <div id="pocketSentenceText" style="font-size:0.95rem; color:#cbd5e1; max-width:320px; word-break:keep-all;"></div>
      <div style="font-size:0.75rem; color:#64748b;">화면을 켜둔 채 주머니에 넣어도 터치 잠금으로 안전합니다.</div>
    </div>
    <div style="display:flex; flex-direction:column; align-items:center; gap:16px;">
      <div style="display:flex; gap:24px; align-items:center;">
        <button id="btnPocketPrev" style="background:none; border:none; color:#94a3b8; font-size:1.5rem; cursor:pointer;">⏮</button>
        <button id="btnPocketPlay" style="background:#1e293b; border:1px solid #334155; color:#818cf8; width:52px; height:52px; border-radius:50%; font-size:1.2rem; cursor:pointer;">⏸</button>
        <button id="btnPocketNext" style="background:none; border:none; color:#94a3b8; font-size:1.5rem; cursor:pointer;">⏭</button>
      </div>
      <button id="btnPocketUnlock" style="width:100%; max-width:320px; padding:14px; border-radius:14px; background:#1e293b; border:1px solid #334155; color:#e2e8f0; font-weight:700; font-size:0.85rem; cursor:pointer; position:relative; overflow:hidden;">
        <span id="pocketUnlockText" style="position:relative; z-index:10;">1.2초간 꾹 눌러 잠금 해제</span>
        <div id="pocketUnlockBar" style="position:absolute; left:0; top:0; bottom:0; width:0%; background:rgba(99,102,241,0.4); transition:width 0.04s linear;"></div>
      </button>
    </div>
  </div>

  <!-- [날짜별 학습 기록 모달] -->
  <div class="modal-backdrop" id="historyModal">
    <div class="modal-content">
      <div class="modal-header">
        <div>
          <h3 style="font-size: 1.1rem; font-weight: 800; color: #1e1b4b;">📅 날짜별 학습 기록 및 복습</h3>
          <p style="font-size: 0.8rem; color: #64748b; margin-top: 2px;">날짜별로 저장된 학습 문장을 원클릭으로 다시 불러와 복습하세요.</p>
        </div>
        <button id="btnCloseHistory" style="background: none; border: none; font-size: 1.3rem; color: #64748b; padding: 4px; min-height: auto;">✕</button>
      </div>

      <div class="modal-body">
        <!-- 통계 스트립 -->
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; background: #f1f5f9; padding: 10px; border-radius: 12px; text-align: center;">
          <div>
            <div style="font-size: 0.75rem; color: #64748b; font-weight: 600;">총 학습 일수</div>
            <div style="font-size: 1.15rem; font-weight: 800; color: #4f46e5;" id="statDays">0일</div>
          </div>
          <div>
            <div style="font-size: 0.75rem; color: #64748b; font-weight: 600;">총 학습 세션</div>
            <div style="font-size: 1.15rem; font-weight: 800; color: #0284c7;" id="statSessions">0회</div>
          </div>
          <div>
            <div style="font-size: 0.75rem; color: #64748b; font-weight: 600;">총 학습 시간</div>
            <div style="font-size: 1.15rem; font-weight: 800; color: #10b981;" id="statMinutes">0분</div>
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 6px;">
          <h4 style="font-size: 0.9rem; font-weight: 700; color: #334155;">저장된 날짜별 기록 목록</h4>
          <button id="btnSaveCurrentToHistory" class="btn-primary" style="padding: 6px 12px; font-size: 0.8rem; min-height: 36px;">
            + 현재 문장 오늘 기록에 저장
          </button>
        </div>

        <div id="historyListContainer" style="display: flex; flex-direction: column; gap: 8px; margin-top: 4px;">
          <!-- 자바스크립트로 날짜별 카드 렌더링 -->
        </div>
      </div>

      <div class="modal-footer">
        <button id="btnClearAllHistory" class="btn-danger" style="font-size: 0.8rem; padding: 6px 12px; min-height: 36px;">
          전체 기록 삭제
        </button>
        <button id="btnCloseHistoryFooter" class="btn-secondary" style="font-size: 0.8rem; padding: 6px 14px; min-height: 36px;">
          닫기
        </button>
      </div>
    </div>
  </div>

  <!-- 표준 HTML <audio> 태그 (Web Audio API 미사용 · 화면 꺼짐 및 백그라운드 앱 전환 시 연속 재생) -->
  <audio id="speechAudio" playsinline preload="auto" style="display:none;"></audio>
  <audio id="bgKeepAliveAudio" loop playsinline preload="auto" style="display:none;"></audio>

  <!-- =========================================================
       [핵심 스크립트]
       1. 표준 HTML <audio> 태그 기반 화면꺼짐·백그라운드 앱전환 연속 재생
       2. navigator.mediaSession API 잠금 화면 재생/일시정지/이전/다음 제어
       3. 날짜별 공부 내용 로컬스토리지 저장 및 불러오기
       ========================================================= -->
  <script>
    // 1. 상태 변수
    let sentences = [];
    let currentSentenceIdx = 0;
    let currentRepeatCount = 1;
    let isPlaying = false;
    let isPaused = false;
    let isFullLoop = ${initialFullLoop};
    let voiceMode = '${initialVoiceMode}';
    let currentGender = 'female';
    let loopCycle = 1;
    let pauseTimeoutId = null;
    let currentUtterance = null;
    let rate = ${rate};

    let audioEngine = 'mp3'; // 기본값: 표준 HTML <audio> (화면 꺼짐/다른 앱 전환 연속 재생)
    let playbackToken = 0;
    let isResting = false;

    // 화면 꺼짐 백그라운드 재생 세션 (표준 HTML <audio> DOM 요소 사용)
    let isBgAudioEnabled = true;
    const speechAudio = document.getElementById('speechAudio');
    const bgAudioElement = document.getElementById('bgKeepAliveAudio');

    // 학습 시간 측정 타이머
    let sessionStartTime = null;
    let sessionElapsedSeconds = 0;
    let sessionTimerInterval = null;

    let englishVoices = [];
    let selectedVoiceURI = '';
    let femaleVoice = null;
    let maleVoice = null;

    // DOM 참조
    const textInput = document.getElementById('textInput');
    const inputRepeat = document.getElementById('inputRepeat');
    const inputPause = document.getElementById('inputPause');
    const inputRate = document.getElementById('inputRate');
    const valRepeat = document.getElementById('valRepeat');
    const valPause = document.getElementById('valPause');
    const valRate = document.getElementById('valRate');
    const selectVoiceMode = document.getElementById('selectVoiceMode');
    const selectEnglishVoice = document.getElementById('selectEnglishVoice');
    const voiceCountBadge = document.getElementById('voiceCountBadge');
    const btnPreviewVoice = document.getElementById('btnPreviewVoice');
    const btnRefreshVoices = document.getElementById('btnRefreshVoices');
    const btnEngineToggle = document.getElementById('btnEngineToggle');
    const engineToggleText = document.getElementById('engineToggleText');

    const btnStart = document.getElementById('btnStart');
    const btnPause = document.getElementById('btnPause');
    const btnResume = document.getElementById('btnResume');
    const btnStop = document.getElementById('btnStop');
    const btnPrev = document.getElementById('btnPrev');
    const btnNext = document.getElementById('btnNext');
    const btnVoiceToggle = document.getElementById('btnVoiceToggle');
    const voiceModeText = document.getElementById('voiceModeText');
    const btnLoopToggle = document.getElementById('btnLoopToggle');
    const loopStatusText = document.getElementById('loopStatusText');
    const btnOpenHistory = document.getElementById('btnOpenHistory');
    const btnSaveToday = document.getElementById('btnSaveToday');
    const historyCount = document.getElementById('historyCount');

    // 모바일 하단 제어 바
    const btnMobilePlay = document.getElementById('btnMobilePlay');
    const btnMobilePrev = document.getElementById('btnMobilePrev');
    const btnMobileNext = document.getElementById('btnMobileNext');
    const btnMobileVoice = document.getElementById('btnMobileVoice');
    const btnMobileHistory = document.getElementById('btnMobileHistory');

    // 자막 요소
    const subtitleText = document.getElementById('subtitleText');
    const labelSentence = document.getElementById('labelSentence');
    const labelRepeat = document.getElementById('labelRepeat');
    const genderBadge = document.getElementById('genderBadge');
    const labelLoop = document.getElementById('labelLoop');
    const labelSpeed = document.getElementById('labelSpeed');
    const pauseIndicator = document.getElementById('pauseIndicator');
    const sentenceList = document.getElementById('sentenceList');

    // 모달 요소
    const historyModal = document.getElementById('historyModal');
    const btnCloseHistory = document.getElementById('btnCloseHistory');
    const btnCloseHistoryFooter = document.getElementById('btnCloseHistoryFooter');
    const btnSaveCurrentToHistory = document.getElementById('btnSaveCurrentToHistory');
    const btnClearAllHistory = document.getElementById('btnClearAllHistory');
    const historyListContainer = document.getElementById('historyListContainer');
    const statDays = document.getElementById('statDays');
    const statSessions = document.getElementById('statSessions');
    const statMinutes = document.getElementById('statMinutes');

    // =========================================================
    // [화면 꺼짐 백그라운드 재생 세션 초기화]
    // Web Audio API 대신 표준 HTML <audio> 태그를 사용하여 백그라운드에서도
    // 오디오 세션과 JS 타이머가 유지되도록 합니다.
    // =========================================================
    const SILENT_WAV_BASE64 = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAP8A/wD/';

    function initBackgroundAudio() {
      if (bgAudioElement) {
        if (!bgAudioElement.src) bgAudioElement.src = SILENT_WAV_BASE64;
        bgAudioElement.loop = true;
        bgAudioElement.volume = 0.01;
      }
    }

    async function startBgAudioSession() {
      if (!isBgAudioEnabled || !bgAudioElement) return;
      try {
        initBackgroundAudio();
        if (bgAudioElement.paused) {
          await bgAudioElement.play();
        }
      } catch (e) {
        console.warn('Background audio session auto-play notice:', e);
      }
    }

    function pauseBgAudioSession() {
      if (bgAudioElement && !bgAudioElement.paused) {
        bgAudioElement.pause();
      }
    }

    function stopBgAudioSession() {
      if (bgAudioElement) {
        bgAudioElement.pause();
        try { bgAudioElement.currentTime = 0; } catch (e) {}
      }
    }

    function splitTextForAudioTts(txt, maxLen) {
      const cleaned = (txt || '').trim().replace(/\\s+/g, ' ');
      if (!cleaned) return [];
      if (cleaned.length <= maxLen) return [cleaned];
      const words = cleaned.split(' ');
      const chunks = [];
      let current = '';
      words.forEach(w => {
        if (w.length > maxLen) {
          if (current) { chunks.push(current); current = ''; }
          for (let i = 0; i < w.length; i += maxLen) chunks.push(w.slice(i, i + maxLen));
          return;
        }
        const cand = current ? current + ' ' + w : w;
        if (cand.length <= maxLen) current = cand;
        else { if (current) chunks.push(current); current = w; }
      });
      if (current) chunks.push(current);
      return chunks;
    }

    function buildAudioTtsUrl(chunk, lang, tier) {
      const encoded = encodeURIComponent(chunk);
      const normLang = (lang || 'en-US').replace('_', '-');
      if (tier === 0) return 'https://translate.google.com/translate_tts?ie=UTF-8&tl=' + encodeURIComponent(normLang) + '&client=tw-ob&q=' + encoded;
      if (tier === 1) return 'https://translate.googleapis.com/translate_tts?ie=UTF-8&tl=' + encodeURIComponent(normLang) + '&client=gtx&q=' + encoded;
      return 'https://dict.youdao.com/dictvoice?audio=' + encoded + '&type=2';
    }

    function setMediaPlaybackState(state) {
      if ('mediaSession' in navigator) {
        try { navigator.mediaSession.playbackState = state; } catch (e) {}
      }
    }

    function safeActionHandler(action, fn) {
      try { navigator.mediaSession.setActionHandler(action, fn); } catch (e) {}
    }

    // 잠금 화면 컨트롤 (MediaSession API)
    function updateMediaSession(text, sentenceIdx, totalSentences, repeat, totalRepeats) {
      if ('mediaSession' in navigator) {
        try {
          const activeVoiceLabel = audioEngine === 'mp3'
            ? '🎵 HTML 오디오 (화면꺼짐 지원)'
            : voiceMode === 'custom'
              ? ('🗣️ ' + ((englishVoices.find(v => v.voiceURI === selectedVoiceURI) || {}).name || '선택한 영어 음성'))
              : (currentGender === 'female' ? '👩 여성 음성' : '👨 남성 음성');
          navigator.mediaSession.metadata = new MediaMetadata({
            title: text || '영어 문장 반복 청취',
            artist: activeVoiceLabel + ' · RepeatEcho',
            album: \`문장 \${sentenceIdx + 1}/\${totalSentences} · 반복 \${repeat}/\${totalRepeats} · 전체 \${loopCycle}회차\`
          });

          setMediaPlaybackState('playing');
          safeActionHandler('play', () => {
            if (!isPlaying) btnStart.click();
            else if (isPaused) btnResume.click();
          });
          safeActionHandler('pause', () => { if (isPlaying && !isPaused) btnPause.click(); });
          safeActionHandler('stop', () => { btnStop.click(); });
          safeActionHandler('previoustrack', () => { if (currentSentenceIdx > 0) jumpToSentence(currentSentenceIdx - 1); });
          safeActionHandler('nexttrack', () => { if (currentSentenceIdx < sentences.length - 1) jumpToSentence(currentSentenceIdx + 1); });
        } catch (e) {
          console.warn('MediaSession error:', e);
        }
      }
    }

    // =========================================================
    // [날짜별 학습 기록 LocalStorage 매니저]
    // =========================================================
    const STORAGE_KEY = 'repeatecho_study_logs_v1';

    function getTodayStr() {
      const d = new Date();
      return \`\${d.getFullYear()}-\${String(d.getMonth() + 1).padStart(2, '0')}-\${String(d.getDate()).padStart(2, '0')}\`;
    }

    function loadHistoryLogs() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        return [];
      }
    }

    function saveHistoryLogs(logs) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
        updateHistoryBadge();
      } catch (e) {}
    }

    function updateHistoryBadge() {
      const logs = loadHistoryLogs();
      historyCount.textContent = logs.length;
    }

    function saveCurrentSession(customTitle) {
      const text = textInput.value.trim();
      if (!text) {
        alert('저장할 문장이 없습니다.');
        return;
      }
      const sents = parseSentences(text);
      const now = new Date();
      const timeStr = \`\${String(now.getHours()).padStart(2, '0')}:\${String(now.getMinutes()).padStart(2, '0')}\`;
      const dateStr = getTodayStr();

      let title = customTitle || '';
      if (!title) {
        const first = sents[0] || '영어 학습';
        title = first.length > 28 ? first.slice(0, 28) + '...' : first;
      }

      const newLog = {
        id: 'log_' + Date.now(),
        date: dateStr,
        time: timeStr,
        timestamp: Date.now(),
        title: title,
        text: text,
        sentenceCount: sents.length,
        repeatCount: parseInt(inputRepeat.value, 10) || 3,
        totalCycles: loopCycle,
        durationSeconds: sessionElapsedSeconds,
        voiceMode: voiceMode
      };

      const logs = [newLog, ...loadHistoryLogs()];
      saveHistoryLogs(logs);
      renderHistoryModal();
      alert(\`✅ 오늘(\${dateStr}) 날짜로 학습 내용이 저장되었습니다!\`);
    }

    function renderHistoryModal() {
      const logs = loadHistoryLogs();
      updateHistoryBadge();

      // 통계 계산
      const uniqueDays = new Set(logs.map(l => l.date)).size;
      const totalSec = logs.reduce((a, b) => a + (b.durationSeconds || 0), 0);
      statDays.textContent = uniqueDays + '일';
      statSessions.textContent = logs.length + '회';
      statMinutes.textContent = Math.round(totalSec / 60) + '분';

      historyListContainer.innerHTML = '';
      if (logs.length === 0) {
        historyListContainer.innerHTML = '<div style="text-align: center; color: #94a3b8; padding: 24px; font-size: 0.9rem;">아직 저장된 날짜별 학습 기록이 없습니다.<br>오늘 공부한 문장을 저장해 보세요!</div>';
        return;
      }

      // 날짜별 그룹화
      logs.forEach((log) => {
        const card = document.createElement('div');
        card.className = 'history-card';
        card.innerHTML = \`
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="font-size: 0.75rem; font-weight: 700; background: #e0e7ff; color: #4338ca; padding: 2px 8px; border-radius: 6px;">\${log.date} \${log.time}</span>
              <span style="font-size: 0.75rem; color: #64748b;">· \${log.sentenceCount}개 문장 (반복 \${log.repeatCount}회)</span>
            </div>
            <button class="btn-delete" style="background: none; border: none; color: #ef4444; font-size: 0.75rem; padding: 2px 6px; cursor: pointer;">삭제</button>
          </div>
          <div style="font-weight: 700; font-size: 0.95rem; color: #0f172a; margin-top: 2px;">\${log.title}</div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 6px;">
            <span style="font-size: 0.75rem; color: #64748b;">학습시간: \${Math.round(log.durationSeconds / 60)}분 · \${log.totalCycles}회차 완료</span>
            <button class="btn-load-review btn-primary" style="padding: 4px 10px; font-size: 0.75rem; min-height: 32px;">
              ▶ 이 날 문장 불러와 복습하기
            </button>
          </div>
        \`;

        // 불러오기
        card.querySelector('.btn-load-review').addEventListener('click', () => {
          textInput.value = log.text;
          inputRepeat.value = log.repeatCount;
          valRepeat.textContent = log.repeatCount + '회';
          renderSentenceList();
          historyModal.style.display = 'none';
          alert(\`📖 "\${log.title}" 문장을 불러왔습니다. '학습 시작'을 누르면 바로 복습할 수 있습니다.\`);
        });

        // 삭제
        card.querySelector('.btn-delete').addEventListener('click', () => {
          if (confirm('이 학습 기록을 삭제하시겠습니까?')) {
            const updated = logs.filter(item => item.id !== log.id);
            saveHistoryLogs(updated);
            renderHistoryModal();
          }
        });

        historyListContainer.appendChild(card);
      });
    }

    // 모달 열기/닫기
    btnOpenHistory.addEventListener('click', () => {
      renderHistoryModal();
      historyModal.style.display = 'flex';
    });
    btnMobileHistory.addEventListener('click', () => {
      btnOpenHistory.click();
    });
    btnCloseHistory.addEventListener('click', () => { historyModal.style.display = 'none'; });
    btnCloseHistoryFooter.addEventListener('click', () => { historyModal.style.display = 'none'; });
    btnSaveToday.addEventListener('click', () => saveCurrentSession());
    btnSaveCurrentToHistory.addEventListener('click', () => saveCurrentSession());
    btnClearAllHistory.addEventListener('click', () => {
      if (confirm('정말로 모든 날짜별 학습 기록을 초기화하시겠습니까?')) {
        localStorage.removeItem(STORAGE_KEY);
        renderHistoryModal();
      }
    });

    // Wake Lock (화면 꺼짐 방지)
    let wakeLockSentinel = null;
    async function requestWakeLock() {
      if ('wakeLock' in navigator) {
        try {
          if (!wakeLockSentinel) {
            wakeLockSentinel = await navigator.wakeLock.request('screen');
            wakeLockSentinel.addEventListener('release', () => { wakeLockSentinel = null; });
          }
        } catch(e) {}
      }
    }
    async function releaseWakeLock() {
      if (wakeLockSentinel) {
        try { await wakeLockSentinel.release(); } catch(e) {}
        wakeLockSentinel = null;
      }
    }

    // 주머니 절전 암전 모드 (OLED Blackout)
    const pocketOverlay = document.getElementById('pocketModeOverlay');
    const pocketClock = document.getElementById('pocketClock');
    const pocketSentenceInfo = document.getElementById('pocketSentenceInfo');
    const pocketSentenceText = document.getElementById('pocketSentenceText');
    const btnPocketUnlock = document.getElementById('btnPocketUnlock');
    const pocketUnlockBar = document.getElementById('pocketUnlockBar');
    const pocketUnlockText = document.getElementById('pocketUnlockText');
    const btnPocketModeToggle = document.getElementById('btnPocketModeToggle');
    const btnMobilePocket = document.getElementById('btnMobilePocket');
    const btnPocketPrev = document.getElementById('btnPocketPrev');
    const btnPocketPlay = document.getElementById('btnPocketPlay');
    const btnPocketNext = document.getElementById('btnPocketNext');

    function enterPocketMode() {
      if (pocketOverlay) pocketOverlay.style.display = 'flex';
      requestWakeLock();
      updatePocketDisplay();
    }

    function exitPocketMode() {
      if (pocketOverlay) pocketOverlay.style.display = 'none';
      if (pocketUnlockBar) pocketUnlockBar.style.width = '0%';
      if (pocketUnlockText) pocketUnlockText.textContent = '1.2초간 꾹 눌러 잠금 해제';
    }

    function updatePocketDisplay() {
      const now = new Date();
      if (pocketClock) {
        pocketClock.textContent = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
      }
      if (sentences.length > 0 && currentSentenceIdx < sentences.length) {
        if (pocketSentenceInfo) pocketSentenceInfo.textContent = '문장 ' + (currentSentenceIdx + 1) + ' / ' + sentences.length + ' · 반복 ' + currentRepeatCount + '회';
        if (pocketSentenceText) pocketSentenceText.textContent = sentences[currentSentenceIdx] || '';
      }
      if (btnPocketPlay) {
        btnPocketPlay.textContent = (!isPlaying || isPaused) ? '▶' : '⏸';
      }
    }

    if (btnPocketModeToggle) btnPocketModeToggle.addEventListener('click', enterPocketMode);
    if (btnMobilePocket) btnMobilePocket.addEventListener('click', enterPocketMode);

    let pocketHoldTimer = null;
    if (btnPocketUnlock) {
      btnPocketUnlock.addEventListener('pointerdown', () => {
        const startTime = Date.now();
        const DURATION = 1200;
        if (pocketHoldTimer) clearInterval(pocketHoldTimer);
        pocketHoldTimer = setInterval(() => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(100, (elapsed / DURATION) * 100);
          if (pocketUnlockBar) pocketUnlockBar.style.width = progress + '%';
          if (pocketUnlockText) pocketUnlockText.textContent = '해제 중... ' + Math.round(progress) + '%';
          if (progress >= 100) {
            clearInterval(pocketHoldTimer);
            pocketHoldTimer = null;
            exitPocketMode();
          }
        }, 30);
      });

      const cancelPocketHold = () => {
        if (pocketHoldTimer) {
          clearInterval(pocketHoldTimer);
          pocketHoldTimer = null;
        }
        if (pocketUnlockBar) pocketUnlockBar.style.width = '0%';
        if (pocketUnlockText) pocketUnlockText.textContent = '1.2초간 꾹 눌러 잠금 해제';
      };
      btnPocketUnlock.addEventListener('pointerup', cancelPocketHold);
      btnPocketUnlock.addEventListener('pointerleave', cancelPocketHold);
    }

    if (btnPocketPrev) btnPocketPrev.addEventListener('click', () => { if (currentSentenceIdx > 0) jumpToSentence(currentSentenceIdx - 1); updatePocketDisplay(); });
    if (btnPocketNext) btnPocketNext.addEventListener('click', () => { if (currentSentenceIdx < sentences.length - 1) jumpToSentence(currentSentenceIdx + 1); updatePocketDisplay(); });
    if (btnPocketPlay) {
      btnPocketPlay.addEventListener('click', () => {
        if (!isPlaying) btnStart.click();
        else if (isPaused) btnResume.click();
        else btnPause.click();
        updatePocketDisplay();
      });
    }

    // 영어 음성 정규화 및 필터링 (en-US, en-GB 등)
    function formatVoiceLang(lang) {
      return (lang || 'en-US').replace('_', '-');
    }

    function isEnglishVoice(voice) {
      return Boolean(voice && voice.lang && /^en([-_]|$)/i.test(voice.lang.trim()));
    }

    function filterEnglishVoices(allVoices) {
      const seen = new Set();
      const filtered = [];
      allVoices.forEach(v => {
        if (!isEnglishVoice(v)) return;
        const key = v.voiceURI || (v.name + '_' + v.lang);
        if (seen.has(key)) return;
        seen.add(key);
        filtered.push(v);
      });
      const priority = ['en-us', 'en-gb', 'en-au', 'en-ca'];
      filtered.sort((a, b) => {
        const la = formatVoiceLang(a.lang).toLowerCase();
        const lb = formatVoiceLang(b.lang).toLowerCase();
        const pa = priority.indexOf(la);
        const pb = priority.indexOf(lb);
        if (pa !== -1 && pb !== -1 && pa !== pb) return pa - pb;
        if (pa !== -1 && pb === -1) return -1;
        if (pa === -1 && pb !== -1) return 1;
        if (la !== lb) return la.localeCompare(lb);
        return a.name.localeCompare(b.name);
      });
      return filtered;
    }

    function renderEnglishVoiceSelect() {
      if (!selectEnglishVoice) return;
      if (voiceCountBadge) {
        voiceCountBadge.textContent = englishVoices.length + '개 로드됨';
      }
      selectEnglishVoice.innerHTML = '';

      const autoOpt = document.createElement('option');
      autoOpt.value = '__alternate__';
      autoOpt.textContent = '👩↔👨 남/녀 자동 교차 (기본 추천)';
      selectEnglishVoice.appendChild(autoOpt);

      if (englishVoices.length === 0) {
        const emptyOpt = document.createElement('option');
        emptyOpt.value = '';
        emptyOpt.disabled = true;
        emptyOpt.textContent = '지원되는 영어 음성을 불러오는 중... (새로고침을 눌러주세요)';
        selectEnglishVoice.appendChild(emptyOpt);
      } else {
        englishVoices.forEach(v => {
          const opt = document.createElement('option');
          opt.value = v.voiceURI;
          opt.textContent = v.name + ' (' + formatVoiceLang(v.lang) + ')';
          selectEnglishVoice.appendChild(opt);
        });
      }

      if (voiceMode === 'custom' && selectedVoiceURI && englishVoices.some(v => v.voiceURI === selectedVoiceURI)) {
        selectEnglishVoice.value = selectedVoiceURI;
      } else if (voiceMode === 'alternate') {
        selectEnglishVoice.value = '__alternate__';
      } else {
        selectEnglishVoice.value = selectedVoiceURI || '__alternate__';
      }
    }

    // 음성 로딩 (모바일 & PC 안정화)
    function loadVoices() {
      if (!('speechSynthesis' in window)) return [];
      const all = window.speechSynthesis.getVoices();
      const filtered = filterEnglishVoices(all);
      if (filtered.length === 0) {
        renderEnglishVoiceSelect();
        return [];
      }

      englishVoices = filtered;

      const femaleHints = ['female', 'samantha', 'victoria', 'zira', 'karen', 'jenny', 'google us english', 'fiona', 'siri voice 2', 'siri voice 4', '여성', '여자'];
      const maleHints = [
        'male', 'alex', 'daniel', 'david', 'george', 'guy', 'fred', 'aaron', 'gordon', 'arthur', 'oliver',
        'siri voice 1', 'siri voice 3', 'voice 1', 'voice 3', 'voice 5', '#male', 'male_1', 'male_2', 'male-local',
        'en-us-x-iom', 'en-us-x-iol', 'en-us-x-tpd', 'en-gb-x-rjs', '남성', '남자', 'google uk english male'
      ];

      if (!femaleVoice || !filtered.some(v => v.voiceURI === femaleVoice.voiceURI)) {
        femaleVoice = filtered.find(v => femaleHints.some(h => v.name.toLowerCase().includes(h))) || filtered[0];
      }
      if (!maleVoice || !filtered.some(v => v.voiceURI === maleVoice.voiceURI)) {
        maleVoice = filtered.find(v => maleHints.some(h => v.name.toLowerCase().includes(h)));
        if (!maleVoice && filtered.length > 1) {
          maleVoice = filtered.find(v => v !== femaleVoice) || filtered[1];
        } else if (!maleVoice) {
          maleVoice = filtered[0];
        }
      }

      if (!selectedVoiceURI || !filtered.some(v => v.voiceURI === selectedVoiceURI)) {
        selectedVoiceURI = (femaleVoice && femaleVoice.voiceURI) || filtered[0].voiceURI;
      }

      renderEnglishVoiceSelect();
      return filtered;
    }

    if ('speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
      if (typeof window.speechSynthesis.addEventListener === 'function') {
        window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
      }
      const initial = loadVoices();
      if (initial.length === 0) {
        [150, 500, 1200, 2500].forEach(ms => {
          setTimeout(() => {
            if (englishVoices.length === 0) loadVoices();
          }, ms);
        });
      }
    }

    function parseSentences(txt) {
      if (!txt || !txt.trim()) return [];
      return txt
        .split(/(?<=[.?!])\\s+|\\n+/)
        .map(s => s.trim())
        .filter(s => s.length > 0);
    }

    function renderSentenceList() {
      sentences = parseSentences(textInput.value);
      sentenceList.innerHTML = '';
      if (sentences.length === 0) {
        sentenceList.innerHTML = '<div style="color: #94a3b8; padding: 12px; font-size: 0.85rem;">입력된 문장이 없습니다.</div>';
        return;
      }
      sentences.forEach((s, i) => {
        const item = document.createElement('div');
        item.className = 'sentence-item' + (i === currentSentenceIdx && isPlaying ? ' active' : '');
        item.id = 'sentence-' + i;
        item.innerHTML = \`<span class="sentence-num">\${i + 1}.</span> <span>\${s}</span>\`;
        item.addEventListener('click', () => jumpToSentence(i));
        sentenceList.appendChild(item);
      });
    }

    function jumpToSentence(idx) {
      if (idx < 0 || idx >= sentences.length) return;
      stopSpeech(true);
      currentSentenceIdx = idx;
      currentRepeatCount = 1;
      currentGender = 'female';
      isPlaying = true;
      isPaused = false;
      startBgAudioSession();
      updateButtons();
      speakCurrent();
    }

    function advanceAfterSentence(targetRepeat, expectedToken) {
      if (playbackToken !== expectedToken || !isPlaying || isPaused) return;

      if (voiceMode === 'alternate') {
        currentGender = currentGender === 'female' ? 'male' : 'female';
      }

      if (currentRepeatCount < targetRepeat) {
        currentRepeatCount++;
        pauseTimeoutId = setTimeout(() => {
          if (playbackToken !== expectedToken || !isPlaying || isPaused) return;
          speakCurrent();
        }, 300);
        return;
      }

      currentRepeatCount = 1;
      currentSentenceIdx++;

      if (currentSentenceIdx < sentences.length) {
        const pauseSec = parseFloat(inputPause.value) || 0;
        if (pauseSec > 0) {
          isResting = true;
          pauseIndicator.textContent = \`다음 문장까지 \${pauseSec}초 휴식 중...\`;
          pauseIndicator.style.display = 'block';
          pauseTimeoutId = setTimeout(() => {
            if (playbackToken !== expectedToken || !isPlaying || isPaused) return;
            isResting = false;
            pauseIndicator.style.display = 'none';
            speakCurrent();
          }, pauseSec * 1000);
        } else {
          speakCurrent();
        }
      } else {
        speakCurrent();
      }
    }

    // 핵심 낭독 함수
    function speakCurrent() {
      if (!isPlaying || isPaused) return;

      if (currentSentenceIdx >= sentences.length) {
        if (isFullLoop && sentences.length > 0) {
          loopCycle++;
          currentSentenceIdx = 0;
          currentRepeatCount = 1;
          isResting = true;
          pauseIndicator.textContent = \`🔁 전체 \${loopCycle}회차 반복을 시작합니다...\`;
          pauseIndicator.style.display = 'block';
          const token = playbackToken;
          pauseTimeoutId = setTimeout(() => {
            if (playbackToken !== token || !isPlaying || isPaused) return;
            isResting = false;
            speakCurrent();
          }, 800);
          return;
        } else {
          finishStudy();
          return;
        }
      }

      stopSpeech(true);
      const token = playbackToken;
      isResting = false;

      // 화면꺼짐 백그라운드 오디오 루프 유지 & Wake Lock 화면꺼짐 방지
      startBgAudioSession();
      requestWakeLock();
      updatePocketDisplay();

      const text = sentences[currentSentenceIdx];
      const targetRepeat = parseInt(inputRepeat.value, 10) || 1;

      // 성별 결정
      let activeGender = currentGender;
      if (voiceMode === 'female-only') activeGender = 'female';
      else if (voiceMode === 'male-only') activeGender = 'male';

      // 자막 및 뱃지 업데이트
      subtitleText.textContent = text;
      subtitleText.classList.remove('waiting');
      labelSentence.textContent = '문장: ' + (currentSentenceIdx + 1) + ' / ' + sentences.length;
      labelRepeat.textContent = '반복: ' + currentRepeatCount + ' / ' + targetRepeat;
      labelLoop.textContent = isFullLoop ? '전체반복: ON (' + loopCycle + '회차)' : '전체반복: OFF';
      labelSpeed.textContent = rate.toFixed(1) + 'x';

      if (audioEngine === 'mp3') {
        genderBadge.textContent = '🎵 HTML <audio> (화면꺼짐 지원)';
        genderBadge.className = 'gender-badge gender-female';
      } else if (voiceMode === 'custom') {
        const customVoice = englishVoices.find(v => v.voiceURI === selectedVoiceURI) || englishVoices[0];
        genderBadge.textContent = '🗣️ ' + (customVoice ? customVoice.name : '선택한 영어 음성');
        genderBadge.className = 'gender-badge gender-female';
      } else if (activeGender === 'female') {
        genderBadge.textContent = '👩 여성 음성';
        genderBadge.className = 'gender-badge gender-female';
      } else {
        genderBadge.textContent = '👨 남성 음성';
        genderBadge.className = 'gender-badge gender-male';
      }

      pauseIndicator.style.display = 'none';
      highlightList();

      // 잠금 화면 / 블루투스 컨트롤 메타데이터 업데이트
      updateMediaSession(text, currentSentenceIdx, sentences.length, currentRepeatCount, targetRepeat);

      if (audioEngine === 'mp3' && speechAudio) {
        const chunks = splitTextForAudioTts(text, 180);
        if (chunks.length === 0) {
          advanceAfterSentence(targetRepeat, token);
          return;
        }
        const customVoice = voiceMode === 'custom'
          ? (englishVoices.find(v => v.voiceURI === selectedVoiceURI) || englishVoices[0])
          : null;
        const preferredLang = customVoice ? formatVoiceLang(customVoice.lang) : 'en-US';

        const playChunk = (chunkIdx, tier) => {
          if (playbackToken !== token || !isPlaying || isPaused) return;
          speechAudio.pause();
          speechAudio.src = buildAudioTtsUrl(chunks[chunkIdx], preferredLang, tier);
          speechAudio.preservesPitch = true;
          speechAudio.playbackRate = Math.max(0.5, Math.min(2.0, rate));

          speechAudio.onended = function() {
            if (playbackToken !== token || !isPlaying || isPaused) return;
            if (chunkIdx + 1 < chunks.length) {
              playChunk(chunkIdx + 1, 0);
            } else {
              advanceAfterSentence(targetRepeat, token);
            }
          };

          speechAudio.onerror = function() {
            if (playbackToken !== token || !isPlaying || isPaused) return;
            if (tier < 2) {
              playChunk(chunkIdx, tier + 1);
            } else {
              speakViaWebSpeech(text, activeGender, targetRepeat, token);
            }
          };

          speechAudio.play().catch(function(err) {
            if (playbackToken !== token) return;
            if (err && err.name === 'AbortError') return;
            if (tier < 2) playChunk(chunkIdx, tier + 1);
            else speakViaWebSpeech(text, activeGender, targetRepeat, token);
          });
        };

        playChunk(0, 0);
        return;
      }

      speakViaWebSpeech(text, activeGender, targetRepeat, token);
    }

    function speakViaWebSpeech(text, activeGender, targetRepeat, expectedToken) {
      if (!('speechSynthesis' in window)) return;
      currentUtterance = new SpeechSynthesisUtterance(text);

      // 음성 먼저 할당 (속도 리셋 버그 방지)
      const customVoice = voiceMode === 'custom'
        ? (englishVoices.find(v => v.voiceURI === selectedVoiceURI) || englishVoices[0])
        : null;

      if (customVoice) {
        currentUtterance.voice = customVoice;
        currentUtterance.lang = formatVoiceLang(customVoice.lang);
      } else if (activeGender === 'female' && femaleVoice) {
        currentUtterance.voice = femaleVoice;
        currentUtterance.lang = formatVoiceLang(femaleVoice.lang);
      } else if (activeGender === 'male' && maleVoice) {
        currentUtterance.voice = maleVoice;
        currentUtterance.lang = formatVoiceLang(maleVoice.lang);
      } else {
        currentUtterance.lang = 'en-US';
      }

      // voice 지정 후 rate 및 pitch 지정
      currentUtterance.rate = Math.max(0.5, Math.min(2.0, rate));
      currentUtterance.pitch = customVoice ? 1.0 : (activeGender === 'female' ? 1.22 : 0.65);

      currentUtterance.onend = function() {
        advanceAfterSentence(targetRepeat, expectedToken);
      };

      currentUtterance.onerror = function(e) {
        if (e.error !== 'canceled' && e.error !== 'interrupted') {
          console.warn('TTS 오류:', e);
        }
      };

      window.speechSynthesis.speak(currentUtterance);
    }

    function highlightList() {
      const items = document.querySelectorAll('.sentence-item');
      items.forEach((item, idx) => {
        if (idx === currentSentenceIdx) {
          item.classList.add('active');
          item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        } else {
          item.classList.remove('active');
        }
      });
    }

    function stopSpeech(keepBgSession) {
      playbackToken++;
      isResting = false;
      if (pauseTimeoutId) {
        clearTimeout(pauseTimeoutId);
        pauseTimeoutId = null;
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (speechAudio) {
        speechAudio.onended = null;
        speechAudio.onerror = null;
        speechAudio.pause();
        try { speechAudio.currentTime = 0; } catch (e) {}
      }
      if (!keepBgSession) {
        stopBgAudioSession();
        releaseWakeLock();
      }
    }

    function finishStudy() {
      stopSpeech(false);
      isPlaying = false;
      isPaused = false;
      subtitleText.textContent = '🎉 모든 문장 청취 완료!';
      subtitleText.classList.remove('waiting');
      pauseIndicator.style.display = 'none';
      setMediaPlaybackState('none');
      updateButtons();

      // 세션 자동 저장 (10초 이상 공부했을 시)
      if (sessionElapsedSeconds > 10) {
        saveCurrentSession();
      }
    }

    function updateButtons() {
      btnStart.disabled = isPlaying && !isPaused;
      btnPause.disabled = !isPlaying || isPaused;
      btnPause.style.display = isPaused ? 'none' : 'inline-flex';
      btnResume.style.display = isPaused ? 'inline-flex' : 'none';
      btnStop.disabled = !isPlaying && !isPaused;

      btnPrev.disabled = !isPlaying || currentSentenceIdx <= 0;
      btnNext.disabled = !isPlaying || currentSentenceIdx >= sentences.length - 1;

      btnMobilePrev.disabled = !isPlaying || currentSentenceIdx <= 0;
      btnMobileNext.disabled = !isPlaying || currentSentenceIdx >= sentences.length - 1;

      if (!isPlaying) {
        btnMobilePlay.textContent = '▶ 시작';
        btnMobilePlay.className = 'btn-primary';
      } else if (isPaused) {
        btnMobilePlay.textContent = '▶ 재개';
        btnMobilePlay.className = 'btn-primary';
      } else {
        btnMobilePlay.textContent = '⏸ 일시정지';
        btnMobilePlay.className = 'btn-secondary';
      }
    }

    // 음성 모드 토글
    function cycleVoiceMode() {
      if (voiceMode === 'alternate') voiceMode = 'female-only';
      else if (voiceMode === 'female-only') voiceMode = 'male-only';
      else voiceMode = 'alternate';

      selectVoiceMode.value = voiceMode;
      updateVoiceModeUI();
    }

    function updateVoiceModeUI() {
      if (voiceMode === 'alternate') {
        voiceModeText.textContent = '남녀 교차';
        btnVoiceToggle.classList.add('toggle-active');
        btnMobileVoice.classList.add('toggle-active');
        btnMobileVoice.textContent = '👥 남녀';
        if (selectEnglishVoice) selectEnglishVoice.value = '__alternate__';
      } else if (voiceMode === 'custom') {
        voiceModeText.textContent = '선택 음성';
        btnVoiceToggle.classList.add('toggle-active');
        btnMobileVoice.classList.add('toggle-active');
        btnMobileVoice.textContent = '🗣️ 선택';
        if (selectEnglishVoice && selectedVoiceURI) selectEnglishVoice.value = selectedVoiceURI;
      } else if (voiceMode === 'female-only') {
        voiceModeText.textContent = '여성만';
        btnVoiceToggle.classList.remove('toggle-active');
        btnMobileVoice.classList.remove('toggle-active');
        btnMobileVoice.textContent = '👩 여성';
      } else {
        voiceModeText.textContent = '남성만';
        btnVoiceToggle.classList.remove('toggle-active');
        btnMobileVoice.classList.remove('toggle-active');
        btnMobileVoice.textContent = '👨 남성';
      }
    }

    btnVoiceToggle.addEventListener('click', cycleVoiceMode);
    btnMobileVoice.addEventListener('click', cycleVoiceMode);
    selectVoiceMode.addEventListener('change', (e) => {
      voiceMode = e.target.value;
      updateVoiceModeUI();
    });

    if (selectEnglishVoice) {
      selectEnglishVoice.addEventListener('change', (e) => {
        const val = e.target.value;
        if (val === '__alternate__') {
          voiceMode = 'alternate';
        } else if (val) {
          selectedVoiceURI = val;
          voiceMode = 'custom';
        }
        selectVoiceMode.value = voiceMode;
        updateVoiceModeUI();
      });
    }

    if (btnRefreshVoices) {
      btnRefreshVoices.addEventListener('click', () => {
        loadVoices();
      });
    }

    if (btnPreviewVoice) {
      btnPreviewVoice.addEventListener('click', () => {
        if (!('speechSynthesis' in window)) return;
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance('Hello! Practice English listening with clear voice playback.');
        const target = englishVoices.find(v => v.voiceURI === selectedVoiceURI) || femaleVoice || englishVoices[0];
        if (target) {
          u.voice = target;
          u.lang = formatVoiceLang(target.lang);
        } else {
          u.lang = 'en-US';
        }
        u.rate = Math.max(0.5, Math.min(2.0, rate));
        u.pitch = 1.0;
        window.speechSynthesis.speak(u);
      });
    }

    btnLoopToggle.addEventListener('click', () => {
      isFullLoop = !isFullLoop;
      loopStatusText.textContent = isFullLoop ? 'ON' : 'OFF';
      btnLoopToggle.classList.toggle('toggle-active', isFullLoop);
      labelLoop.textContent = isFullLoop ? '전체반복: ON (' + loopCycle + '회차)' : '전체반복: OFF';
    });

    textInput.addEventListener('input', () => {
      if (!isPlaying) renderSentenceList();
    });

    if (btnEngineToggle) {
      btnEngineToggle.addEventListener('click', () => {
        audioEngine = audioEngine === 'mp3' ? 'webspeech' : 'mp3';
        if (audioEngine === 'mp3') {
          btnEngineToggle.classList.add('toggle-active');
          if (engineToggleText) engineToggleText.textContent = 'HTML 오디오(화면꺼짐 지원)';
        } else {
          btnEngineToggle.classList.remove('toggle-active');
          if (engineToggleText) engineToggleText.textContent = '기기 음성(남녀교차)';
        }
        if (isPlaying && !isPaused) {
          stopSpeech(true);
          speakCurrent();
        }
      });
    }

    inputRepeat.addEventListener('input', (e) => { valRepeat.textContent = e.target.value + '회'; });
    inputPause.addEventListener('input', (e) => { valPause.textContent = e.target.value + '초'; });
    inputRate.addEventListener('input', (e) => {
      const v = parseFloat(e.target.value);
      rate = Math.max(0.5, Math.min(2.0, v));
      valRate.textContent = rate.toFixed(1) + 'x';
      labelSpeed.textContent = rate.toFixed(1) + 'x';

      if (isPlaying && !isPaused && !isResting) {
        if (audioEngine === 'mp3' && speechAudio && !speechAudio.paused) {
          speechAudio.playbackRate = rate;
        } else {
          stopSpeech(true);
          speakCurrent();
        }
      }
    });

    btnStart.addEventListener('click', () => {
      sentences = parseSentences(textInput.value);
      if (sentences.length === 0) return alert('문장을 입력해 주세요!');
      renderSentenceList();
      stopSpeech(true);
      currentSentenceIdx = 0;
      currentRepeatCount = 1;
      currentGender = 'female';
      loopCycle = 1;
      isPlaying = true;
      isPaused = false;
      sessionElapsedSeconds = 0;
      sessionStartTime = Date.now();

      if (sessionTimerInterval) clearInterval(sessionTimerInterval);
      sessionTimerInterval = setInterval(() => {
        if (isPlaying && !isPaused) {
          sessionElapsedSeconds++;
        }
      }, 1000);

      startBgAudioSession();
      updateButtons();
      speakCurrent();
    });

    btnPause.addEventListener('click', () => {
      if (!isPlaying || isPaused) return;
      playbackToken++;
      isPaused = true;
      if (pauseTimeoutId) clearTimeout(pauseTimeoutId);
      if (audioEngine === 'mp3' && speechAudio) {
        speechAudio.pause();
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.pause();
      }
      pauseBgAudioSession();
      setMediaPlaybackState('paused');
      updateButtons();
    });

    btnResume.addEventListener('click', () => {
      if (!isPlaying || !isPaused) return;
      isPaused = false;
      startBgAudioSession();
      setMediaPlaybackState('playing');
      updateButtons();
      if (audioEngine === 'mp3' && speechAudio) {
        if (!isResting && speechAudio.src && speechAudio.paused && !speechAudio.ended && speechAudio.currentTime > 0) {
          speechAudio.play().catch(() => speakCurrent());
        } else {
          speakCurrent();
        }
        return;
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.resume();
        if (!window.speechSynthesis.speaking) speakCurrent();
      }
    });

    btnStop.addEventListener('click', () => {
      stopSpeech(false);
      isPlaying = false;
      isPaused = false;
      if (sessionTimerInterval) clearInterval(sessionTimerInterval);
      currentSentenceIdx = 0;
      currentRepeatCount = 1;
      currentGender = 'female';
      loopCycle = 1;
      subtitleText.textContent = "'학습 시작'을 누르면 여자/남자 음성이 번갈아가며 재생됩니다.";
      subtitleText.classList.add('waiting');
      labelSentence.textContent = '문장: 0 / ' + sentences.length;
      setMediaPlaybackState('none');
      updateButtons();
    });

    btnPrev.addEventListener('click', () => {
      if (currentSentenceIdx > 0) jumpToSentence(currentSentenceIdx - 1);
    });

    btnNext.addEventListener('click', () => {
      if (currentSentenceIdx < sentences.length - 1) jumpToSentence(currentSentenceIdx + 1);
    });

    btnMobilePlay.addEventListener('click', () => {
      if (!isPlaying) btnStart.click();
      else if (isPaused) btnResume.click();
      else btnPause.click();
    });

    btnMobilePrev.addEventListener('click', () => btnPrev.click());
    btnMobileNext.addEventListener('click', () => btnNext.click());

    // 초기화
    renderSentenceList();
    updateHistoryBadge();
    updateVoiceModeUI();
  </script>
</body>
</html>`;
}
