(() => {
  const STORAGE_KEY = 'ddalkknara-field-logs-v1'
  const categories = [
    { name: '폐합성', color: '#6c8df5', tint: 'blue' },
    { name: '유동상', color: '#a78bfa', tint: 'lilac' },
    { name: '슬러지', color: '#31b8a5', tint: 'teal' },
    { name: '일반/지정 폐기물', color: '#f2a56f', tint: 'orange' }
  ]
  const dayMs = 86400000
  const today = new Date()
  const toIsoDate = (date) => {
    const d = new Date(date)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }
  const shiftDate = (days) => {
    const d = new Date(today)
    d.setDate(d.getDate() + days)
    return toIsoDate(d)
  }
  const seedData = [
    ['한강 리버뷰 신축 현장', '폐합성', 8.4, -1, '폐합성 수지류 분리 배출'],
    ['성수 리모델링 현장', '슬러지', 4.2, -1, '탈수 슬러지 반출 완료'],
    ['마곡 업무시설 현장', '유동상', 6.1, -2, '정기 수거'],
    ['판교 물류센터 현장', '일반/지정 폐기물', 2.6, -3, '지정 폐기물 포함'],
    ['한강 리버뷰 신축 현장', '슬러지', 5.8, -4, '침전조 슬러지 반출'],
    ['성수 리모델링 현장', '폐합성', 3.9, -6, '포장재 및 폐합성 수지'],
    ['마곡 업무시설 현장', '일반/지정 폐기물', 1.7, -7, '혼합 폐기물 처리'],
    ['판교 물류센터 현장', '유동상', 7.4, -9, '정기 수거 및 계근'],
    ['한강 리버뷰 신축 현장', '유동상', 6.8, -12, '현장 반출 기록'],
    ['성수 리모델링 현장', '일반/지정 폐기물', 2.2, -17, '작업 종료 후 반출'],
    ['마곡 업무시설 현장', '폐합성', 9.3, -21, '폐합성 수지류 반출'],
    ['판교 물류센터 현장', '슬러지', 4.7, -26, '침전조 정기 처리']
  ].map(([site, category, amount, days, note], i) => ({
    id: `seed-${i + 1}`,
    site,
    category,
    amount,
    date: shiftDate(days),
    note,
    createdAt: Date.now() - i * 60000
  }))

  const safeRead = () => {
    try {
      const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null')
      return Array.isArray(value) ? value : seedData
    } catch {
      return seedData
    }
  }
  let logs = safeRead()
  let selectedRange = 30
  let activeView = 'dashboard'
  let toastTimer

  const $ = (selector, root = document) => root.querySelector(selector)
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)]
  const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]))
  const formatNumber = (value, decimals = 1) => new Intl.NumberFormat('ko-KR', { minimumFractionDigits: 0, maximumFractionDigits: decimals }).format(value)
  const formatDate = (value, options = { month: 'short', day: 'numeric' }) => new Intl.DateTimeFormat('ko-KR', options).format(new Date(`${value}T00:00:00`))
  const category = (name) => categories.find((item) => item.name === name) || categories[0]
  const sortedLogs = () => [...logs].sort((a, b) => b.date.localeCompare(a.date) || (b.createdAt || 0) - (a.createdAt || 0))
  const filteredLogs = () => {
    const cutoff = new Date(today)
    cutoff.setDate(cutoff.getDate() - selectedRange + 1)
    const cutoffIso = toIsoDate(cutoff)
    return logs.filter((item) => item.date >= cutoffIso && item.date <= toIsoDate(today))
  }
  const save = () => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(logs)) } catch { showToast('브라우저 저장 공간을 확인해 주세요.') }
  }
  const setText = (selector, value) => { const el = $(selector); if (el) el.textContent = value }

  function renderCategoryOptions() {
    const entry = $('#entry-category')
    const filter = $('#category-filter')
    if (entry) entry.innerHTML = categories.map((item) => `<option value="${escapeHtml(item.name)}">${escapeHtml(item.name)}</option>`).join('')
    if (filter) filter.innerHTML = '<option value="all">모든 분류</option>' + categories.map((item) => `<option value="${escapeHtml(item.name)}">${escapeHtml(item.name)}</option>`).join('')
  }

  function renderStats() {
    const visible = filteredLogs()
    const total = visible.reduce((sum, item) => sum + Number(item.amount || 0), 0)
    const siteCount = new Set(visible.map((item) => item.site)).size
    const totals = categories.map((item) => ({ ...item, amount: visible.filter((log) => log.category === item.name).reduce((sum, log) => sum + Number(log.amount || 0), 0) })).sort((a, b) => b.amount - a.amount)
    setText('#stat-total', formatNumber(total))
    setText('#stat-logs', formatNumber(visible.length, 0))
    setText('#stat-sites', formatNumber(siteCount, 0))
    setText('#stat-top-category', totals[0]?.amount ? totals[0].name.replace(' 폐기물', '') : '—')
    setText('#stat-top-share', totals[0]?.amount ? `전체 처리량의 ${Math.round(totals[0].amount / total * 100)}%` : '분류별 비중 집계')
    setText('#nav-log-count', String(logs.length))
    setText('#donut-total', formatNumber(total))
    const shares = totals.map((item) => total ? item.amount / total * 100 : 0)
    let offset = 0
    const stops = totals.map((item, i) => {
      const start = offset
      offset += shares[i]
      return `${item.color} ${start}% ${offset}%`
    })
    const donut = $('#donut-chart')
    if (donut) donut.style.background = total ? `conic-gradient(${stops.join(', ')})` : '#edf0f5'
    const legend = $('#category-legend')
    if (legend) legend.innerHTML = totals.map((item) => `<div class="legend-row"><span class="legend-name"><i class="legend-dot ${item.tint}"></i>${escapeHtml(item.name)}</span><strong>${formatNumber(item.amount)} <small>톤</small></strong></div>`).join('')
    renderChart(visible)
    renderPivot(visible)
    renderReportCategories(totals, total)
  }

  function renderChart(visible) {
    const start = new Date(today)
    start.setHours(0, 0, 0, 0)
    start.setDate(start.getDate() - selectedRange + 1)
    const buckets = Array.from({ length: 7 }, (_, index) => {
      const from = new Date(start)
      from.setDate(start.getDate() + Math.floor(index * selectedRange / 7))
      const to = new Date(start)
      to.setDate(start.getDate() + Math.floor((index + 1) * selectedRange / 7) - 1)
      to.setHours(23, 59, 59, 999)
      if (index === 6) to.setTime(new Date(today).setHours(23, 59, 59, 999))
      const bucketLogs = visible.filter((item) => {
        const date = new Date(`${item.date}T12:00:00`)
        return date >= from && date <= to
      })
      return { from, to, logs: bucketLogs }
    })
    const maximum = Math.max(1, ...buckets.map((bucket) => bucket.logs.reduce((sum, item) => sum + Number(item.amount || 0), 0)))
    const bars = $('#chart-bars')
    if (bars) bars.innerHTML = buckets.map((bucket) => {
      const sums = categories.map((item) => bucket.logs.filter((log) => log.category === item.name).reduce((sum, log) => sum + Number(log.amount || 0), 0))
      const total = sums.reduce((sum, amount) => sum + amount, 0)
      const height = Math.max(3, total / maximum * 100)
      const stacks = sums.map((amount, index) => amount ? `<i class="bar-segment ${categories[index].tint}" style="height:${amount / total * 100}%"></i>` : '').join('')
      return `<div class="bar-column" title="${escapeHtml(formatDate(toIsoDate(bucket.from), { month: 'short', day: 'numeric' }))} · ${formatNumber(total)}톤"><div class="bar-stack" style="height:${height}%">${stacks || '<i class="bar-segment empty-bar" style="height:3px"></i>'}</div></div>`
    }).join('')
    const labels = $('#chart-labels')
    if (labels) labels.innerHTML = buckets.map((bucket) => `<span>${escapeHtml(formatDate(toIsoDate(bucket.from), { month: 'numeric', day: 'numeric' }))}</span>`).join('')
  }

  function renderPivot(visible) {
    const sites = [...new Set(visible.map((item) => item.site))].sort((a, b) => a.localeCompare(b, 'ko'))
    const head = $('#pivot-head')
    const body = $('#pivot-body')
    if (!head || !body) return
    head.innerHTML = `<tr><th>현장명</th>${categories.map((item) => `<th><span class="table-category"><i class="legend-dot ${item.tint}"></i>${escapeHtml(item.name)}</span></th>`).join('')}<th>총 처리량</th><th>일지 건수</th></tr>`
    const siteRows = sites.map((site) => {
      const siteLogs = visible.filter((item) => item.site === site)
      const values = categories.map((item) => siteLogs.filter((log) => log.category === item.name).reduce((sum, log) => sum + Number(log.amount || 0), 0))
      const total = values.reduce((sum, value) => sum + value, 0)
      return `<tr><td class="site-cell">${escapeHtml(site)}</td>${values.map((value) => `<td>${value ? formatNumber(value) : '<span class="muted-dash">—</span>'}</td>`).join('')}<td class="total-cell">${formatNumber(total)} <small>톤</small></td><td>${siteLogs.length}<small> 건</small></td></tr>`
    })
    const allTotals = categories.map((item) => visible.filter((log) => log.category === item.name).reduce((sum, log) => sum + Number(log.amount || 0), 0))
    const total = allTotals.reduce((sum, value) => sum + value, 0)
    const sumRow = `<tr class="total-row"><td>전체 합계</td>${allTotals.map((value) => `<td>${formatNumber(value)} <small>톤</small></td>`).join('')}<td>${formatNumber(total)} <small>톤</small></td><td>${visible.length}<small> 건</small></td></tr>`
    body.innerHTML = (siteRows.length ? siteRows : [`<tr><td colspan="7" class="pivot-empty">선택한 기간에 집계할 일지가 없습니다.</td></tr>`]).join('') + sumRow
  }

  function renderReportCategories(totals, total) {
    const target = $('#report-category-list')
    if (!target) return
    target.innerHTML = totals.map((item) => {
      const percent = total ? item.amount / total * 100 : 0
      return `<div class="report-category-item"><div class="report-category-label"><span><i class="legend-dot ${item.tint}"></i>${escapeHtml(item.name)}</span><strong>${formatNumber(item.amount)} <small>톤 · ${Math.round(percent)}%</small></strong></div><div class="progress-track"><i class="${item.tint}" style="width:${percent}%"></i></div></div>`
    }).join('')
  }

  function renderTableRows() {
    const recent = sortedLogs().slice(0, 5)
    const target = $('#recent-rows')
    if (target) target.innerHTML = recent.map((item) => `<tr><td><div class="site-name">${escapeHtml(item.site)}</div><div class="site-note">${escapeHtml(item.note || '현장 처리 기록')}</div></td><td><span class="category-pill ${category(item.category).tint}"><i></i>${escapeHtml(item.category)}</span></td><td class="amount-cell">${formatNumber(Number(item.amount))} <small>톤</small></td><td>${escapeHtml(formatDate(item.date, { year: 'numeric', month: 'short', day: 'numeric' }))}</td><td><span class="status-pill"><i></i>확인 완료</span></td></tr>`).join('')
    $('#recent-empty')?.classList.toggle('hidden', logs.length > 0)
    const query = ($('#log-search')?.value || '').trim().toLocaleLowerCase('ko')
    const selectedCategory = $('#category-filter')?.value || 'all'
    const filtered = sortedLogs().filter((item) => (selectedCategory === 'all' || item.category === selectedCategory) && (!query || `${item.site} ${item.note || ''} ${item.category}`.toLocaleLowerCase('ko').includes(query)))
    const logRows = $('#logs-rows')
    if (logRows) logRows.innerHTML = filtered.map((item) => `<tr><td><div class="site-name">${escapeHtml(item.site)}</div><div class="site-note">${escapeHtml(item.note || '현장 처리 기록')}</div></td><td><span class="category-pill ${category(item.category).tint}"><i></i>${escapeHtml(item.category)}</span></td><td class="amount-cell">${formatNumber(Number(item.amount))} <small>톤</small></td><td>${escapeHtml(formatDate(item.date, { year: 'numeric', month: 'short', day: 'numeric' }))}</td><td class="note-cell">${escapeHtml(item.note || '—')}</td><td><button class="delete-button" data-delete="${escapeHtml(item.id)}" aria-label="${escapeHtml(item.site)} 일지 삭제">×</button></td></tr>`).join('')
    $('#logs-empty')?.classList.toggle('hidden', filtered.length > 0)
    setText('#result-count', `${filtered.length}건`)
  }

  function render() {
    renderStats()
    renderTableRows()
    $$('.range-tab').forEach((button) => button.classList.toggle('selected', Number(button.dataset.range) === selectedRange))
  }

  function showToast(message) {
    const toast = $('#toast')
    if (!toast) return
    toast.textContent = message
    toast.classList.add('show')
    clearTimeout(toastTimer)
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2800)
  }

  function switchView(view) {
    activeView = view
    $$('.page-view').forEach((section) => section.classList.toggle('active', section.id === `${view}-view`))
    $$('.nav-item').forEach((item) => item.classList.toggle('active', item.dataset.view === view))
    setText('#breadcrumb-current', ({ dashboard: '대시보드', logs: '현장 일지', reports: '피벗 리포트' })[view] || '대시보드')
    $('#sidebar')?.classList.remove('mobile-open')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function openModal() {
    const modal = $('#entry-modal')
    if (!modal) return
    const date = $('#entry-form [name="date"]')
    if (date) date.value = toIsoDate(today)
    modal.classList.add('open')
    modal.setAttribute('aria-hidden', 'false')
    setTimeout(() => $('#entry-form [name="site"]')?.focus(), 50)
  }
  function closeModal() {
    $('#entry-modal')?.classList.remove('open')
    $('#entry-modal')?.setAttribute('aria-hidden', 'true')
    $('#form-error')?.classList.add('hidden')
  }

  function exportCsv() {
    const visible = filteredLogs()
    const rows = [['현장명', '폐기물 분류', '처리량(톤)', '기록 날짜', '메모'], ...visible.map((item) => [item.site, item.category, item.amount, item.date, item.note || ''])]
    const csv = '\uFEFF' + rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\r\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `딸깍나라_현장리포트_${toIsoDate(today)}.csv`
    link.click()
    URL.revokeObjectURL(url)
    showToast('CSV 리포트를 다운로드했어요.')
  }

  function bindEvents() {
    $$('.nav-item, [data-view="logs"], [data-view="reports"]').forEach((button) => button.addEventListener('click', () => switchView(button.dataset.view)))
    $$('.range-tab').forEach((button) => button.addEventListener('click', () => { selectedRange = Number(button.dataset.range); render() }))
    $('#open-entry')?.addEventListener('click', openModal)
    $$('[data-open-entry="true"]').forEach((button) => button.addEventListener('click', openModal))
    $('#close-entry')?.addEventListener('click', closeModal)
    $('#cancel-entry')?.addEventListener('click', closeModal)
    $('#entry-modal')?.addEventListener('click', (event) => { if (event.target === $('#entry-modal')) closeModal() })
    document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeModal() })
    $('#mobile-menu')?.addEventListener('click', () => $('#sidebar')?.classList.toggle('mobile-open'))
    $('#log-search')?.addEventListener('input', renderTableRows)
    $('#category-filter')?.addEventListener('change', renderTableRows)
    $('#export-csv')?.addEventListener('click', exportCsv)
    $('#chart-unit')?.addEventListener('click', () => showToast('처리량은 톤 단위로 표시됩니다.'))
    $('#entry-form')?.addEventListener('submit', (event) => {
      event.preventDefault()
      const form = event.currentTarget
      const data = new FormData(form)
      const amount = Number(data.get('amount'))
      const date = String(data.get('date'))
      if (!Number.isFinite(amount) || amount <= 0) {
        $('#form-error').textContent = '처리량은 0보다 큰 숫자로 입력해 주세요.'
        $('#form-error').classList.remove('hidden')
        return
      }
      if (date > toIsoDate(today)) {
        $('#form-error').textContent = '미래 날짜로는 일지를 등록할 수 없습니다.'
        $('#form-error').classList.remove('hidden')
        return
      }
      logs.unshift({ id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, site: String(data.get('site')).trim(), category: String(data.get('category')), amount, date, note: String(data.get('note') || '').trim(), createdAt: Date.now() })
      save()
      form.reset()
      closeModal()
      render()
      switchView('dashboard')
      showToast('현장 일지를 저장했어요.')
    })
    $('#logs-rows')?.addEventListener('click', (event) => {
      const button = event.target.closest('[data-delete]')
      if (!button) return
      const log = logs.find((item) => item.id === button.dataset.delete)
      if (!log || !window.confirm(`“${log.site}” 일지를 삭제할까요?`)) return
      logs = logs.filter((item) => item.id !== button.dataset.delete)
      save()
      render()
      showToast('일지를 삭제했어요.')
    })
  }

  function init() {
    setText('#today-label', new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' }).format(today))
    renderCategoryOptions()
    bindEvents()
    render()
  }
  init()
})()
