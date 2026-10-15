import { Hono } from 'hono'
import { renderer } from './renderer'

const app = new Hono()

app.use(renderer)

app.get('/', (c) => {
  return c.html(`<!DOCTYPE html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#f7f8fb" />
    <meta name="description" content="현장 일지와 폐기물 처리 현황을 한눈에 관리하는 딸깍나라 대시보드" />
    <title>딸깍나라 · 현장 운영 대시보드</title>
    <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='9' fill='%236d8bf2'/%3E%3Cpath d='M8 17l5 5 11-12' fill='none' stroke='white' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
    <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Noto+Sans+KR:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
    <link href="/static/style.css" rel="stylesheet" />
  </head>
  <body>
    <div class="app-shell">
      <aside class="sidebar" id="sidebar">
        <a class="brand" href="#dashboard" aria-label="딸깍나라 홈">
          <span class="brand-mark"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5 10 17l9-10"/><path d="M12 3v2M21 12h-2M5 12H3"/></svg></span>
          <span class="brand-name">딸깍나라<span class="brand-dot">.</span><small>현장 운영 대시보드</small></span>
        </a>
        <div class="nav-label">워크스페이스</div>
        <nav class="main-nav" aria-label="주 메뉴">
          <button class="nav-item active" data-view="dashboard"><span class="nav-icon">▦</span>대시보드</button>
          <button class="nav-item" data-view="logs"><span class="nav-icon">▤</span>현장 일지<span class="nav-count" id="nav-log-count">0</span></button>
          <button class="nav-item" data-view="reports"><span class="nav-icon">▥</span>피벗 리포트</button>
        </nav>
        <div class="sidebar-bottom">
          <div class="help-card"><span class="help-icon">✦</span><strong>오늘도 안전하게</strong><p>현장 기록을 간편하게 모으고<br/>필요한 데이터로 확인하세요.</p><span class="help-spark">✳</span></div>
          <div class="user-profile"><div class="avatar">관</div><div class="user-info"><strong>현장 관리자</strong><span>운영팀</span></div><button class="more-button" aria-label="계정 메뉴">···</button></div>
        </div>
      </aside>

      <main class="main-content">
        <header class="topbar">
          <button class="mobile-menu" id="mobile-menu" aria-label="메뉴 열기">☰</button>
          <div class="breadcrumb"><span>딸깍나라</span><i>/</i><strong id="breadcrumb-current">대시보드</strong></div>
          <div class="topbar-actions"><span class="today-label" id="today-label"></span><button class="icon-button notification-button" aria-label="알림">♧<i></i></button><div class="top-avatar">관</div></div>
        </header>

        <div class="page-wrap">
          <section class="page-view active" id="dashboard-view">
            <div class="page-heading">
              <div><div class="eyebrow"><span class="live-dot"></span> 현장 운영 한눈에 보기</div><h1>좋은 하루예요, 관리자님 <span class="wave">✳</span></h1><p class="page-subtitle">오늘의 현장 기록과 폐기물 처리 현황을 확인해 보세요.</p></div>
              <button class="primary-button" id="open-entry"><span class="plus">＋</span> 일지 작성</button>
            </div>
            <div class="filter-row"><div class="range-tabs" role="group" aria-label="조회 기간"><button class="range-tab" data-range="7">최근 7일</button><button class="range-tab selected" data-range="30">최근 30일</button><button class="range-tab" data-range="90">최근 90일</button></div><div class="updated-label"><span class="tiny-clock">◷</span> 방금 업데이트</div></div>
            <div class="stats-grid">
              <article class="stat-card"><div class="stat-top"><span>총 처리량</span><span class="stat-icon mint">↗</span></div><div class="stat-value"><strong id="stat-total">0</strong><span>톤</span></div><div class="stat-foot"><span class="trend positive">↑ 12.8%</span><span>지난 기간 대비</span></div><div class="stat-sparkline spark-one"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div></article>
              <article class="stat-card"><div class="stat-top"><span>등록된 일지</span><span class="stat-icon lavender">▤</span></div><div class="stat-value"><strong id="stat-logs">0</strong><span>건</span></div><div class="stat-foot"><span class="trend positive">↑ 8.3%</span><span>지난 기간 대비</span></div><div class="stat-sparkline spark-two"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div></article>
              <article class="stat-card"><div class="stat-top"><span>운영 현장</span><span class="stat-icon peach">⌖</span></div><div class="stat-value"><strong id="stat-sites">0</strong><span>곳</span></div><div class="stat-foot"><span class="neutral-foot">현재 기록 기준</span></div><div class="stat-sparkline spark-three"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div></article>
              <article class="stat-card"><div class="stat-top"><span>가장 많은 분류</span><span class="stat-icon yellow">✳</span></div><div class="stat-value category-stat"><strong id="stat-top-category">—</strong></div><div class="stat-foot"><span class="neutral-foot" id="stat-top-share">분류별 비중 집계</span></div><div class="stat-sparkline spark-four"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div></article>
            </div>

            <div class="dashboard-grid">
              <section class="panel volume-panel"><div class="panel-heading"><div><h2>처리량 추이</h2><p>날짜별 폐기물 처리 현황</p></div><button class="select-button" id="chart-unit">톤 단위⌄</button></div><div class="chart-legend"><span><i class="legend-dot blue"></i>폐합성</span><span><i class="legend-dot lilac"></i>유동상</span><span><i class="legend-dot teal"></i>슬러지</span><span><i class="legend-dot orange"></i>일반/지정</span></div><div class="chart-area"><div class="chart-y-labels"><span>12</span><span>9</span><span>6</span><span>3</span><span>0</span></div><div class="chart-main"><div class="chart-grid-lines"><i></i><i></i><i></i><i></i><i></i></div><div class="chart-bars" id="chart-bars"></div><div class="chart-x-labels" id="chart-labels"></div></div></div></section>
              <section class="panel category-panel"><div class="panel-heading"><div><h2>분류별 처리 비중</h2><p>선택 기간 전체 기준</p></div><button class="kebab" aria-label="더 보기">···</button></div><div class="donut-wrap"><div class="donut-chart" id="donut-chart"><div class="donut-center"><strong id="donut-total">0</strong><span>총 처리량 · 톤</span></div></div></div><div class="category-legend" id="category-legend"></div></section>
            </div>

            <section class="panel recent-panel"><div class="panel-heading"><div><h2>최근 현장 일지</h2><p>가장 최근에 등록된 기록이에요.</p></div><button class="text-button" data-view="logs">전체 일지 보기 <span>→</span></button></div><div class="table-wrap"><table class="data-table"><thead><tr><th>현장 / 작업</th><th>분류</th><th>처리량</th><th>기록 날짜</th><th>상태</th></tr></thead><tbody id="recent-rows"></tbody></table></div><div class="empty-state hidden" id="recent-empty"><span>▤</span><strong>아직 등록된 일지가 없어요</strong><p>첫 현장 일지를 작성해 보세요.</p><button class="text-button" data-open-entry="true">＋ 일지 작성</button></div></section>
          </section>

          <section class="page-view" id="logs-view">
            <div class="page-heading"><div><div class="eyebrow"><span class="live-dot"></span> 기록 관리</div><h1>현장 일지</h1><p class="page-subtitle">현장에서 올라온 작업 기록을 확인하고 관리하세요.</p></div><button class="primary-button" data-open-entry="true"><span class="plus">＋</span> 일지 작성</button></div>
            <section class="panel logs-panel"><div class="list-toolbar"><div class="search-box"><span>⌕</span><input id="log-search" type="search" placeholder="현장명, 메모 검색" aria-label="일지 검색"/></div><select class="filter-select" id="category-filter" aria-label="분류 필터"><option value="all">모든 분류</option></select><span class="result-count" id="result-count"></span></div><div class="table-wrap"><table class="data-table"><thead><tr><th>현장 / 작업</th><th>분류</th><th>처리량</th><th>기록 날짜</th><th>메모</th><th></th></tr></thead><tbody id="logs-rows"></tbody></table></div><div class="empty-state hidden" id="logs-empty"><span>⌕</span><strong>조건에 맞는 기록이 없어요</strong><p>검색어나 분류를 바꾸어 다시 확인해 주세요.</p></div></section>
          </section>

          <section class="page-view" id="reports-view">
            <div class="page-heading"><div><div class="eyebrow"><span class="live-dot"></span> 데이터 분석</div><h1>피벗 리포트</h1><p class="page-subtitle">기간과 폐기물 분류에 따라 처리량을 빠르게 비교해 보세요.</p></div><button class="secondary-button" id="export-csv">↓ CSV 내보내기</button></div>
            <div class="filter-row"><div class="range-tabs" role="group" aria-label="조회 기간"><button class="range-tab" data-range="7">최근 7일</button><button class="range-tab selected" data-range="30">최근 30일</button><button class="range-tab" data-range="90">최근 90일</button></div><div class="updated-label">단위: 톤</div></div>
            <section class="panel pivot-panel"><div class="panel-heading"><div><h2>분류 × 현장 피벗 테이블</h2><p>현장별·분류별 합계와 일지 건수를 비교합니다.</p></div><span class="table-tag">요약 리포트</span></div><div class="table-wrap"><table class="data-table pivot-table"><thead id="pivot-head"></thead><tbody id="pivot-body"></tbody></table></div><div class="pivot-footnote">※ 선택한 기간의 등록된 현장 일지를 기준으로 자동 집계됩니다.</div></section>
            <div class="dashboard-grid report-bottom"><section class="panel"><div class="panel-heading"><div><h2>분류별 상세</h2><p>전체 처리량 대비 분류 비중</p></div></div><div id="report-category-list" class="report-category-list"></div></section><section class="panel report-note"><div class="report-note-icon">✦</div><h2>현장의 데이터가<br/>좋은 운영을 만들어요.</h2><p>일지를 꾸준히 기록하면 폐기물 흐름과 현장별 처리량을 더 정확하게 파악할 수 있습니다.</p><button class="secondary-button" data-open-entry="true">＋ 새 일지 추가</button></section></div>
          </section>
        </div>
      </main>
    </div>

    <div class="modal-backdrop" id="entry-modal" aria-hidden="true"><section class="entry-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div class="modal-heading"><div><div class="eyebrow"><span class="live-dot"></span> 새 기록</div><h2 id="modal-title">현장 일지 작성</h2></div><button class="modal-close" id="close-entry" aria-label="닫기">×</button></div><p class="modal-description">현장 정보를 입력하면 대시보드와 리포트에 바로 반영돼요.</p><form id="entry-form"><label class="form-field"><span>현장명 <b>*</b></span><input name="site" required maxlength="60" placeholder="예: 강남 리뉴얼 현장"/></label><div class="form-row"><label class="form-field"><span>폐기물 분류 <b>*</b></span><select name="category" required id="entry-category"></select></label><label class="form-field"><span>처리량 (톤) <b>*</b></span><input name="amount" type="number" min="0.01" step="0.01" required placeholder="0.00"/></label></div><label class="form-field"><span>기록 날짜 <b>*</b></span><input name="date" type="date" required/></label><label class="form-field"><span>메모 <small>선택</small></span><textarea name="note" rows="3" maxlength="200" placeholder="작업 내용이나 전달 사항을 적어주세요."></textarea></label><div class="form-error hidden" id="form-error"></div><div class="modal-actions"><button class="secondary-button" type="button" id="cancel-entry">취소</button><button class="primary-button" type="submit">일지 저장 <span>→</span></button></div></form></section></div>
    <div class="toast" id="toast" role="status" aria-live="polite"></div>
    <script src="/static/app.js" defer></script>
  </body>
</html>
  `)
})

export default app
