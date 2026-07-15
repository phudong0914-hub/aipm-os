const DATA = DATA_PAYLOAD;
    const $ = (s) => document.querySelector(s);
    const $$ = (s) => Array.from(document.querySelectorAll(s));
    const norm = (s) => (s || '').toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d');

    const state = { q:'', stage:'all', gate:'all', group:'all', agency:'all', risk:'all', checkStage:'all', checkGate:'all', hideDone:false };
    let checked = JSON.parse(localStorage.getItem('q9_misa_style_checked') || '{}');

    function tags(arr, cls=''){ return (arr||[]).map(t=>`<span class="tag ${cls}">${t}</span>`).join(''); }
    function agencySet(){
      const set = new Set();
      DATA.steps.forEach(s=>[...(s.responsible||[]),...(s.appraisal||[]),...(s.approval||[]),...(s.coordination||[])].forEach(a=>set.add(a)));
      return Array.from(set).sort();
    }
    function groupSet(){ return Array.from(new Set(DATA.steps.map(s=>s.group))).sort(); }
    function riskSet(){ return Array.from(new Set(DATA.steps.flatMap(s=>s.riskFlags||[]))).sort(); }
    function allText(s){ return [s.id,s.stageName,s.group,s.stepName,s.gate,...(s.responsible||[]),...(s.appraisal||[]),...(s.approval||[]),...(s.output||[]),...(s.riskFlags||[]),...(s.digitalTags||[])].join(' '); }

    function typeFilteredSteps() {
      return DATA.steps.filter(s => {
        if (state.projectType === 'infra') {
          if (s.group.includes('Thi tuyển phương án kiến trúc') || s.id.startsWith('I.6') || s.id.startsWith('I.7')) return false;
        }
        return true;
      });
    }

    function renderHero(){
      const filtered = typeFilteredSteps();
      const steps = filtered.length;
      const req = filtered.filter(s=>s.required).length;
      const cond = filtered.filter(s=>s.conditional).length;
      const groups = new Set(filtered.map(s=>s.group)).size;
      const digital = new Set(filtered.flatMap(s=>s.digitalTags||[])).size;
      let risksCount = DATA.risks.length;
      if (state.projectType === 'infra') risksCount += 1;
      else if (state.projectType === 'civil') risksCount += 1;
      else if (state.projectType === 'ppp') risksCount = 2; // based on our adjustRisks logic

      const list = [
        ['03','Giai đoạn'], ['17','Gate'], [steps,'Bước hồ sơ'], [groups,'Nhóm hồ sơ'],
        [req,'Hồ sơ bắt buộc'], [cond,'Hồ sơ có điều kiện'], [risksCount,'Risk flags'], [digital,'Digital modules']
      ];
      $('#hero-kpis').innerHTML = list.map(x=>`<div class="kpi"><strong>${x[0]}</strong><span>${x[1]}</span></div>`).join('');

      const cols = [
        {title:'Chuẩn bị dự án',desc:'Các bước hình thành dự án, chủ trương, chuẩn bị đầu tư',items:[['🗺️','Quy hoạch','Thông tin quy hoạch, điều chỉnh, công bố, cắm mốc'],['📄','Chủ trương đầu tư','Báo cáo đề xuất, thẩm định, quyết định'],['🧮','Dự toán chuẩn bị','Dự toán, thẩm định, phê duyệt'],['🌱','ĐTM','Thẩm định, phê duyệt môi trường']]},
        {title:'Thực hiện dự án',desc:'Khảo sát, thiết kế, đấu thầu, thi công, nghiệm thu',items:[['📍','Khảo sát - Thiết kế','Khảo sát, TKKT, TKBVTC, điều chỉnh'],['🤝','Lựa chọn nhà thầu','Chỉ định thầu, đấu thầu rộng rãi'],['📑','Hợp đồng','Ký kết, phụ lục, phát sinh'],['👷','Thi công - Chất lượng','Vật liệu, nhật ký, nghiệm thu']]},
        {title:'Kết thúc dự án',desc:'Bàn giao, bảo hành, kiểm toán, quyết toán, vận hành',items:[['📦','Bàn giao','Bàn giao công trình, hồ sơ hoàn công'],['🛡️','Bảo hành','Thông báo, nghiệm thu bảo hành'],['🔎','Kiểm toán','Quyết định, biên bản, báo cáo'],['📊','Quyết toán','Thẩm tra, phê duyệt quyết toán']]},
        {title:'Quản lý - Điều hành',desc:'Điều hành theo trách nhiệm, luồng phối hợp và KPI',items:[['🧭','Stage-Gate','G0–G16 theo vòng đời dự án'],['🔄','BPMN Swimlane','Luồng phối hợp giữa các bên'],['📋','RACI','Phân quyền và trách nhiệm'],['📈','KPI Dashboard','Tiến độ, chất lượng, tài chính, số hóa']]},
        {title:'Dữ liệu - Pháp lý',desc:'Tích hợp hồ sơ số và các lớp dữ liệu trọng yếu',items:[['🏗️','BIM/CDE','BEP, hồ sơ thiết kế, dữ liệu hoàn công'],['🗂️','Checklist số','Kiểm soát thành phần hồ sơ'],['⚠️','Risk Matrix','Rủi ro, ứng phó, chủ thể kiểm soát'],['📚','Pháp lý 2026','Danh mục văn bản cần cập nhật/xác minh']]}
      ];
      $('#mega-grid').innerHTML = cols.map(col=>`<div class="mega-col"><h3>${col.title}</h3><p class="desc">${col.desc}</p>${col.items.map(it=>`<div class="mega-item" data-keyword="${it[1]}"><div class="mega-icon">${it[0]}</div><div><b>${it[1]}</b><span>${it[2]}</span></div></div>`).join('')}</div>`).join('');
      
      $$('.mega-item').forEach(item => {
        item.onclick = () => {
          const kw = item.dataset.keyword;
          state.gate = 'all';
          state.stage = 'all';
          $('#filter-gate').value = 'all';
          $('#filter-stage').value = 'all';
          
          if(typeof syncSearch === 'function') {
            syncSearch(kw);
          } else {
            state.q = kw;
            $('#global-search').value = kw;
            if ($('#search-step')) $('#search-step').value = kw;
            renderFiltered();
          }
          
          document.getElementById('lookup').scrollIntoView({behavior: 'smooth'});
          
          $('#global-search').style.transition = 'all 0.3s';
          $('#global-search').style.backgroundColor = '#eff6ff';
          setTimeout(() => $('#global-search').style.backgroundColor = '', 500);
        };
      });
    }

    function renderLayers(){
      const layers = [
        ['🗺️','GIS / Quy hoạch','Thông tin quy hoạch, ranh giới, vị trí, hạ tầng kết nối, cắm mốc, đấu nối.'],
        ['🏗️','BIM / IFC / CDE','Kế hoạch BEP, hồ sơ thiết kế, khối lượng, mô hình công trình, dữ liệu hoàn công.'],
        ['📁','Hồ sơ Q9','Checklist, mẫu biểu, hồ sơ đầu vào, hồ sơ đầu ra và trạng thái kiểm soát.'],
        ['📊','Dashboard điều hành','KPI, Risk Matrix, Gate status, tiến độ, chi phí, nghiệm thu, quyết toán, vận hành.']
      ];
      $('#layer-grid').innerHTML = layers.map(l=>`<div class="layer-card"><div class="ico">${l[0]}</div><b>${l[1]}</b><p>${l[2]}</p></div>`).join('');
    }

    function renderGates(){
      $('#gate-grid').innerHTML = DATA.gates.map(g=>`<button class="gate-card ${state.gate===g.id?'active':''}" data-gate="${g.id}"><small>${g.stage}</small><div class="g-top"><span class="g-id">${g.id}</span><span class="g-ico">${g.icon}</span></div><b>${g.name}</b></button>`).join('');
      $$('.gate-card').forEach(btn=>btn.onclick=()=>{
        state.gate = state.gate === btn.dataset.gate ? 'all' : btn.dataset.gate;
        $('#filter-gate').value = state.gate;
        $('#active-gate-pill').textContent = state.gate === 'all' ? 'Tất cả Gate' : state.gate;
        renderFiltered();
        location.hash = '#lookup';
      });
    }

    function initFilters(){
      $('#filter-stage').innerHTML = `<option value="all">Tất cả giai đoạn</option>` + DATA.stages.map(s=>`<option value="${s.id}">${s.id} — ${s.name}</option>`).join('');
      $('#filter-gate').innerHTML = `<option value="all">Tất cả Gate</option>` + DATA.gates.map(g=>`<option value="${g.id}">${g.id} — ${g.name}</option>`).join('');
      $('#filter-group').innerHTML = `<option value="all">Tất cả nhóm hồ sơ</option>` + groupSet().map(g=>`<option value="${g}">${g}</option>`).join('');
      $('#filter-agency').innerHTML = `<option value="all">Tất cả cơ quan</option>` + agencySet().map(a=>`<option value="${a}">${a}</option>`).join('');
      $('#filter-risk').innerHTML = `<option value="all">Tất cả cảnh báo</option>` + riskSet().map(r=>`<option value="${r}">${r}</option>`).join('');
      $('#check-stage').innerHTML = $('#filter-stage').innerHTML;
      $('#check-gate').innerHTML = $('#filter-gate').innerHTML;
    }

    function filteredSteps(){
      const q = norm(state.q);
      return DATA.steps.filter(s=>{
        const agencies = [...(s.responsible||[]),...(s.appraisal||[]),...(s.approval||[]),...(s.coordination||[])].join('|');
        
        // Filter by project type
        if (state.projectType === 'infra') {
          // Infrastructure usually doesn't require architectural contest
          if (s.group.includes('Thi tuyển phương án kiến trúc') || s.id.startsWith('I.6') || s.id.startsWith('I.7')) return false;
        }
        
        return (!q || norm(allText(s)).includes(q)) &&
          (state.stage==='all' || s.stage===state.stage) &&
          (state.gate==='all' || s.gate===state.gate) &&
          (state.group==='all' || s.group===state.group) &&
          (state.agency==='all' || agencies.includes(state.agency)) &&
          (state.risk==='all' || (s.riskFlags||[]).includes(state.risk));
      });
    }

    function renderTable(){
      const rows = filteredSteps();
      $('#result-pill').textContent = `${rows.length} bước`;
      $('#steps-table').innerHTML = `<thead><tr><th>STT</th><th>Giai đoạn</th><th>Nhóm hồ sơ</th><th>Bước thực hiện</th><th>Gate</th><th>Cơ quan chính</th><th>Sản phẩm đầu ra</th><th>Cảnh báo</th></tr></thead><tbody>${rows.map(s=>`<tr>
        <td><b>${s.id}</b></td>
        <td>${s.stage}<br><span style="color:#64748b;font-size:12px">${s.stageName}</span></td>
        <td>${s.icon||'📌'} <b>${s.group}</b><br>${s.conditional?'<span class="tag warn">Có điều kiện</span>':'<span class="tag green">Bắt buộc</span>'}</td>
        <td><b>${s.stepName}</b><br>${(s.controlPoints||[]).slice(0,2).map(x=>`<span class="tag primary">✓ ${x}</span>`).join('')}</td>
        <td><span class="tag primary">${s.gate}</span></td>
        <td>${(s.responsible||[]).join('<br>')}${s.appraisal?.length?'<br><br><b>Thẩm định/kiểm tra:</b><br>'+s.appraisal.join('<br>'):''}</td>
        <td>${(s.output||[]).join('<br>')}<br>${(s.digitalTags||[]).map(d=>`<span class="tag">${d}</span>`).join('')}</td>
        <td>${(s.riskFlags||[]).slice(0,3).map(r=>`<span class="tag warn">⚠ ${r}</span>`).join('')}</td>
      </tr>`).join('')}</tbody>`;
    }

    function renderAccordion(){
      const stageIds = ['I','II','III'];
      const groupsByStage = {};
      DATA.steps.filter(s=>stageIds.includes(s.stage)).forEach(s=>{
        if(!groupsByStage[s.stage]) groupsByStage[s.stage] = {};
        if(!groupsByStage[s.stage][s.group]) groupsByStage[s.stage][s.group] = [];
        groupsByStage[s.stage][s.group].push(s);
      });
      const stageLabels = {'I':'Giai đoạn chuẩn bị dự án','II':'Giai đoạn thực hiện dự án','III':'Giai đoạn kết thúc dự án'};
      $('#phase-accordion').innerHTML = stageIds.map((st,idx)=>`<details ${idx===0?'open':''}><summary>${st} — ${stageLabels[st]}</summary><div class="details-body"><div class="accordion">${Object.keys(groupsByStage[st]||{}).map(g=>`<details><summary>${g} <span class="tag primary">${groupsByStage[st][g].length} mục</span></summary><div class="details-body"><div class="mini-group">${groupsByStage[st][g].map(item=>`<div class="mini-item"><span class="id">${item.id}</span><span class="gate">${item.gate}</span><span>${item.icon||'📌'} ${item.stepName}</span><span>${item.conditional?'<span class="tag warn">Có ĐK</span>':'<span class="tag green">Bắt buộc</span>'}</span></div>`).join('')}</div></div></details>`).join('')}</div></div></details>`).join('');
    }

    function renderBpmn(){
      $('#bpmn-list').innerHTML = DATA.bpmn.map(row=>`<div class="lane"><div class="lane-name">${row.order}. ${row.lane}</div><div class="lane-body"><b>${row.action}</b><span><b>Đầu vào:</b> ${(row.input||[]).join('; ')}<br><b>Đầu ra:</b> ${(row.output||[]).join('; ')}</span></div><div class="lane-next"><span><b>Chuyển tiếp:</b> ${row.next}<br><b>Rẽ nhánh:</b> ${row.decision}</span></div></div>`).join('');
    }

    function renderRaci(){
      const roles = DATA.raciRoles;
      $('#raci-table').innerHTML = `<thead><tr><th>Gate</th>${roles.map(r=>`<th>${r}</th>`).join('')}</tr></thead><tbody>${DATA.raci.map(r=>`<tr><td><b>${r.gate}</b><br>${r.name}</td>${roles.map(role=>`<td>${r[role] ? `<span class="tag ${r[role]==='A'?'danger':r[role]==='R'?'green':r[role]==='C'?'primary':''}">${r[role]}</span>` : ''}</td>`).join('')}</tr>`).join('')}</tbody>`;
    }

    function saveChecks(){ localStorage.setItem('q9_misa_style_checked', JSON.stringify(checked)); }
    function filteredChecks(){
      return DATA.checklists.filter(c=>(state.checkStage==='all'||c.stage===state.checkStage)&&(state.checkGate==='all'||c.gate===state.checkGate)&&(!state.hideDone||!checked[c.id]));
    }
    function renderChecks(){
      const done = DATA.checklists.filter(c=>checked[c.id]).length;
      $('#check-pill').textContent = `${done}/${DATA.checklists.length}`;
      $('#check-grid').innerHTML = filteredChecks().map(c=>`<label class="check-card ${checked[c.id]?'done':''}"><input type="checkbox" data-id="${c.id}" ${checked[c.id]?'checked':''}><div><div class="check-title">${c.critical?'<span class="tag danger">Critical</span> ':''}<b>${c.item}</b></div><div class="check-meta">${c.stage} · ${c.gate} · ${c.group}<br>Chuẩn bị: ${c.preparedBy}<br>Kiểm tra: ${c.checkedBy}<br>${c.note}</div></div><span>${c.critical?'<span class="tag warn">⚠ Bắt buộc</span>':'<span class="tag">Thường</span>'}</span></label>`).join('');
      $$('input[data-id]').forEach(el=>el.onchange=()=>{ checked[el.dataset.id]=el.checked; if(!el.checked) delete checked[el.dataset.id]; saveChecks(); renderChecks(); renderKpis(); });
    }

    function renderKpis(){
      const total = DATA.steps.length;
      const required = DATA.steps.filter(s=>s.required).length;
      const conditional = DATA.steps.filter(s=>s.conditional).length;
      const completed = DATA.checklists.filter(c=>checked[c.id]).length;
      const pccc = DATA.steps.filter(s=>norm(allText(s)).includes('pccc')).length;
      const env = DATA.steps.filter(s=>norm(allText(s)).includes('dtm') || norm(allText(s)).includes('moi truong')).length;
      const qa = DATA.steps.filter(s=>norm(allText(s)).includes('nghiem thu')).length;
      const cost = DATA.steps.filter(s=>norm(allText(s)).includes('thanh toan') || norm(allText(s)).includes('quyet toan')).length;
      const gis = DATA.steps.filter(s=>(s.digitalTags||[]).includes('GIS')).length;
      const bim = DATA.steps.filter(s=>(s.digitalTags||[]).includes('BIM/CDE')).length;
      const digital = DATA.steps.filter(s=>(s.digitalTags||[]).length>1).length;
      const cards = [
        ['📁',total,'Tổng số bước hồ sơ'],['✅',required,'Hồ sơ bắt buộc'],['⚠️',conditional,'Hồ sơ có điều kiện'],['☑️',completed,'Checklist đã tích'],
        ['🔥',pccc,'Hồ sơ cần PCCC'],['🌱',env,'Hồ sơ môi trường/ĐTM'],['🧪',qa,'Điểm nghiệm thu'],['💰',cost,'Nhóm tài chính'],
        ['🗺️',gis,'Bước gắn GIS'],['🏗️',bim,'Bước gắn BIM/CDE'],['💾',digital,'Bước có thể số hóa'],['📊',DATA.risks.length,'Risk flags']
      ];
      $('#kpi-grid').innerHTML = cards.map(c=>`<div class="kpi-card"><div class="top"><div class="emoji">${c[0]}</div><span class="tag primary">KPI</span></div><strong>${c[1]}</strong><span>${c[2]}</span></div>`).join('');
    }

    function renderRisks(){
      $('#risk-grid').innerHTML = DATA.risks.map(r=>`<div class="risk-card" data-level="${r.level}"><span class="risk-level">${r.level}</span><b>${r.riskId} · ${r.riskGroup}</b><p>${r.description}</p><p><b>Gate:</b> ${r.gate} · <b>Xác suất:</b> ${r.probability} · <b>Tác động:</b> ${r.impact}</p><p><b>Ứng phó:</b> ${r.mitigation}</p><p><b>Kiểm soát:</b> ${r.owner}</p></div>`).join('');
    }

    function renderDigital(){
      $('#digital-table').innerHTML = `<thead><tr><th>Gate</th><th>Nội dung số hóa</th><th>Công cụ</th><th>Dữ liệu đầu ra</th><th>Mức ưu tiên</th></tr></thead><tbody>${DATA.digitalMatrix.map(d=>`<tr><td><span class="tag primary">${d.gate}</span></td><td>${d.content}</td><td>${(d.tools||[]).join('<br>')}</td><td>${(d.outputs||[]).join('<br>')}</td><td><span class="tag ${d.priority==='Rất cao'?'danger':'warn'}">${d.priority}</span></td></tr>`).join('')}</tbody>`;
    }

    function renderLegal(){
      $('#legal-table').innerHTML = `<thead><tr><th>Nhóm pháp lý</th><th>Văn bản</th><th>Nội dung điều chỉnh</th><th>Áp dụng cho Gate</th><th>Trạng thái</th><th>Tương tác / Tải về</th></tr></thead><tbody>${DATA.legalDocuments.map(l=>{
        let statusClass = 'warn';
        if (l.status.includes('Còn hiệu lực')) statusClass = 'green';
        else if (l.status.includes('Hết hiệu lực')) statusClass = 'danger';
        
        const tvplSearchUrl = l.tvplLink || ('https://thuvienphapluat.vn/page/tim-van-ban.aspx?keyword=' + encodeURIComponent(l.document) + '&match=True&area=0');
        
        const pdfLinkHtml = l.pdfLink ? 
          `<a href="${l.pdfLink}" target="_blank" style="color:var(--red); font-weight:700; font-size:11px; text-decoration:underline;">📥 PDF</a>` : 
          `<a href="#" onclick="alert('Văn bản này hiện chưa có file PDF đính kèm.'); return false;" style="color:#94a3b8; font-weight:700; font-size:11px; text-decoration:line-through; cursor:not-allowed;">📥 PDF</a>`;
          
        const wordLinkHtml = l.docLink ? 
          `<a href="${l.docLink}" target="_blank" style="color:var(--primary); font-weight:700; font-size:11px; text-decoration:underline;">📥 Word</a>` : 
          `<a href="#" onclick="alert('Văn bản này hiện chưa có file Word đính kèm.'); return false;" style="color:#94a3b8; font-weight:700; font-size:11px; text-decoration:line-through; cursor:not-allowed;">📥 Word</a>`;
        
        return `<tr>
          <td><b>${l.group}</b></td>
          <td>${l.document}</td>
          <td>${l.content}</td>
          <td>${(l.gates||[]).map(g=>`<span class="tag primary">${g}</span>`).join('')}</td>
          <td><span class="tag ${statusClass}">${l.status}</span></td>
          <td>
            <div style="display:flex; flex-direction:column; gap:6px;">
              <a href="${tvplSearchUrl}" target="_blank" style="color:var(--primary); font-weight:700; font-size:11px; display:inline-flex; align-items:center; gap:4px;">⚖️ Xem bản gốc</a>
              <div style="display:flex; gap:8px;">
                ${pdfLinkHtml}
                ${wordLinkHtml}
              </div>
            </div>
          </td>
        </tr>`;
      }).join('')}</tbody>`;
    }

    function renderFiltered(){ renderGates(); renderTable(); }

    // AI Center and Agentic Loop variables
    let lastChatResponse = '';
    let lastGeneratedStateFile = '';

    function selectPromptTemplate(type) {
      const inputs = {
        'totrinh': 'Lập tờ trình đề xuất chủ trương đầu tư dự án Trường tiểu học chuẩn quốc gia theo Luật Đầu tư công số 58/2024/QH15',
        'quyetdinh': 'Soạn quyết định phê duyệt dự án đầu tư xây dựng công trình theo Luật Xây dựng 2025 số 135/2025/QH15',
        'dtm': 'Lập đề cương báo cáo đánh giá sơ bộ tác động môi trường (ĐTM) theo Luật Bảo vệ môi trường số 72/2020/QH14'
      };
      $('#ai-chat-input').value = inputs[type] || '';
      submitChatPrompt();
    }

    function submitChatPrompt() {
      const q = $('#ai-chat-input').value.trim();
      if(!q) return;
      
      const chatLogs = $('#ai-chat-messages');
      
      // Append user message
      const userBubble = document.createElement('div');
      userBubble.style.alignSelf = 'flex-end';
      userBubble.style.background = 'var(--panel-soft)';
      userBubble.style.padding = '10px 14px';
      userBubble.style.borderRadius = '12px 12px 0 12px';
      userBubble.style.maxWidth = '85%';
      userBubble.style.fontSize = '13px';
      userBubble.innerHTML = `<b>Bạn:</b> ${q}`;
      chatLogs.appendChild(userBubble);
      
      $('#ai-chat-input').value = '';
      chatLogs.scrollTop = chatLogs.scrollHeight;
      
      // Add loading indicator
      const loaderBubble = document.createElement('div');
      loaderBubble.style.background = '#f1f5f9';
      loaderBubble.style.padding = '12px';
      loaderBubble.style.borderRadius = '8px';
      loaderBubble.innerHTML = '🤖 <i>AI đang biên soạn tài liệu và phân tích pháp lý...</i>';
      chatLogs.appendChild(loaderBubble);
      chatLogs.scrollTop = chatLogs.scrollHeight;

      setTimeout(() => {
        chatLogs.removeChild(loaderBubble);
        
        let response = '';
        if (q.includes('chủ trương') || q.includes('totrinh') || q.includes('58/2024')) {
          response = `### CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
**Độc lập - Tự do - Hạnh phúc**
*Hà Nội, ngày 14 tháng 07 năm 2026*

**TỜ TRÌNH**
**Về việc phê duyệt chủ trương đầu tư dự án: Xây dựng Trường tiểu học đạt chuẩn quốc gia**
Kính gửi: Ủy ban nhân dân Thành phố

Căn cứ Luật Đầu tư công số 58/2024/QH15 ngày 30/11/2024;
Căn cứ các Nghị định hướng dẫn thi hành Luật Đầu tư công năm 2026;
Chủ đầu tư kính trình UBND Thành phố xem xét, phê duyệt chủ trương đầu tư dự án với các nội dung chính như sau:

1. **Tên dự án:** Xây dựng Trường tiểu học đạt chuẩn quốc gia.
2. **Nhóm dự án:** Dự án Nhóm B.
3. **Mục tiêu đầu tư:** Hoàn thiện cơ sở vật chất, nâng cao chất lượng giáo dục tiểu học tại địa phương đạt chuẩn quốc gia mức độ 2.
4. **Quy mô đầu tư:** Xây mới nhà lớp học 4 tầng (20 phòng học), nhà hiệu bộ và trang thiết bị đồng bộ phục vụ giảng dạy.
5. **Tổng mức đầu tư sơ bộ:** 45.000.000.000 VNĐ (Bốn mươi lăm tỷ đồng).
6. **Cơ cấu nguồn vốn:** Vốn đầu tư công (Ngân sách thành phố hỗ trợ 80%, ngân sách quận đối ứng 20%).
7. **Thời gian thực hiện:** 2026 - 2028.

Kính trình Ủy ban nhân dân Thành phố xem xét quyết định./.
**ĐẠI DIỆN CHỦ ĐẦU TƯ**
*(Ký tên, đóng dấu)*`;
        } else if (q.includes('phê duyệt dự án') || q.includes('quyetdinh') || q.includes('135/2025')) {
          response = `### ỦY BAN NHÂN DÂN THÀNH PHỐ
Số: 1045/QĐ-UBND
*Hà Nội, ngày 14 tháng 07 năm 2026*

**QUYẾT ĐỊNH**
**Về việc phê duyệt dự án đầu tư xây dựng công trình**
ỦY BAN NHÂN DÂN THÀNH PHỐ

Căn cứ Luật Tổ chức chính quyền địa phương năm 2015;
Căn cứ Luật Xây dựng số 135/2025/QH15 ngày 25/06/2025;
Căn cứ Nghị định số 207/2026/NĐ-CP ngày 15/06/2026 về quản lý chất lượng và thi công xây dựng;
Xét đề nghị của Giám đốc Sở Xây dựng tại Tờ trình báo cáo kết quả thẩm định,

**QUYẾT ĐỊNH:**

**Điều 1. Phê duyệt dự án đầu tư xây dựng công trình với các nội dung chính:**
1. **Tên công trình:** Đầu tư xây dựng hạ tầng kỹ thuật khu dân cư mới.
2. **Chủ đầu tư:** Ban Quản lý dự án đầu tư xây dựng chuyên ngành.
3. **Địa điểm xây dựng:** Quận trung tâm hành chính mới.
4. **Quy chuẩn áp dụng:** Sửa đổi 01:2026 QCVN 04:2021/BXD về nhà ở và công trình công cộng.
5. **Tổng mức đầu tư phê duyệt:** 120.000.000.000 VNĐ (Một trăm hai mươi tỷ đồng).

**Điều 2. Tổ chức thực hiện:**
Chủ đầu tư căn cứ nội dung phê duyệt khẩn trương hoàn thiện các bước khảo sát thiết kế bản vẽ thi công và lập dự toán trình duyệt đúng quy định tại Nghị định 207/2026/NĐ-CP.

**Điều 3. Hiệu lực thi hành:**
Quyết định này có hiệu lực kể từ ngày ký./.
**TM. ỦY BAN NHÂN DÂN**
**CHỦ TỊCH**
*(Đã ký)*`;
        } else {
          response = `### ĐỀ CƯƠNG BÁO CÁO ĐÁNH GIÁ SƠ BỘ TÁC ĐỘNG MÔI TRƯỜNG (ĐTM)
*(Ban hành kèm theo Luật Bảo vệ môi trường số 72/2020/QH14)*

1. **Thông tin chung về dự án đầu tư:**
   - Tên dự án, thông tin Chủ đầu tư, địa điểm triển khai.
   - Công suất, quy mô thiết kế và các hạng mục phụ trợ.
2. **Các yếu tố nhạy cảm về môi trường:**
   - Khoảng cách đến khu dân cư gần nhất, nguồn tiếp nhận nước thải.
   - Hiện trạng đa dạng sinh học và nhu cầu sử dụng đất rừng/đất lúa (nếu có).
3. **Đánh giá sơ bộ tác động môi trường trong quá trình xây dựng & vận hành:**
   - Bụi, tiếng ồn, nước thải thi công, rác thải sinh hoạt.
   - Các rủi ro sạt lở, cháy nổ, an toàn lao động.
4. **Biện pháp giảm thiểu tác động tiêu cực:**
   - Xây dựng hệ thống rãnh gom nước thải tạm thời, hố lắng lọc bùn đất.
   - Bố trí xe phun nước dập bụi 2 lần/ngày.
5. **Kết luận và kiến nghị:**
   - Cam kết thực hiện đúng Luật Bảo vệ môi trường số 72/2020/QH14.`;
        }

        lastChatResponse = response;
        
        // Show copy button
        $('#btn-copy-chat').style.display = 'block';

        const aiBubble = document.createElement('div');
        aiBubble.style.background = '#ffffff';
        aiBubble.style.border = '1px solid var(--line)';
        aiBubble.style.padding = '14px';
        aiBubble.style.borderRadius = '12px 12px 12px 0';
        aiBubble.style.maxWidth = '90%';
        aiBubble.style.boxShadow = '0 2px 8px rgba(0,0,0,0.02)';
        aiBubble.innerHTML = `<b>🤖 Trợ lý AI Pháp lý:</b><br><pre style="white-space:pre-wrap; font-size:12px; background:#f8fafc; border:1px solid var(--line); padding:10px; border-radius:6px; margin:8px 0; max-height:250px; overflow-y:auto;">${response}</pre>`;
        chatLogs.appendChild(aiBubble);
        chatLogs.scrollTop = chatLogs.scrollHeight;
      }, 1200);
    }

    function copyChatResponse() {
      if(!lastChatResponse) return;
      navigator.clipboard.writeText(lastChatResponse);
      alert('Đã sao chép văn bản hành chính vào bộ nhớ đệm!');
    }

    function runAgenticLoop() {
      const trigger = $('#loop-trigger').value;
      const goal = $('#loop-goal').value;
      const stopRule = $('#loop-stop-rule').value;
      
      const isCostActive = $('#agent-cost').checked;
      const isEnvActive = $('#agent-env').checked;
      const isRiskActive = $('#agent-risk').checked;
      
      const terminal = $('#agent-terminal-logs');
      terminal.textContent = '';
      $('#btn-download-state').style.display = 'none';

      // Logs generation helper
      const log = (msg, delay) => {
        return new Promise(resolve => {
          setTimeout(() => {
            terminal.textContent += msg + '\n';
            terminal.scrollTop = terminal.scrollHeight;
            resolve();
          }, delay);
        });
      };

      (async () => {
        await log(`[SYSTEM] Bắt đầu khởi động Vòng lặp giám sát (Loop Engineering System)...`, 200);
        await log(`[SYSTEM] Cấu hình: Trigger = ${trigger} | Goal = ${goal} | Stop Rule = ${stopRule}`, 300);
        await log(`[TRIGGER] Đã phát hiện tín hiệu kích hoạt từ quy trình: ${trigger === 'G1' ? 'Gate G1 (Chủ trương)' : trigger === 'G9' ? 'Gate G9 (Thiết kế)' : 'Gate G14 (Thanh toán)'}`, 400);
        
        await log(`\n--- KHỞI TẠO CÁC TÁC NHÂN AI (AGENT SCATTERING) ---`, 400);
        await log(`[Legal Agent] ONLINE - Chuyên gia kiểm toán văn bản quy phạm pháp luật.`, 300);
        if (isCostActive) await log(`[Cost Agent] ONLINE - Chuyên gia định mức chi phí & thẩm định dự toán.`, 200);
        if (isEnvActive) await log(`[Env Agent] ONLINE - Giám sát bảo vệ môi trường & đánh giá ĐTM.`, 200);
        if (isRiskActive) await log(`[Risk Agent] ONLINE - Phân tích rủi ro & giải pháp ứng phó.`, 200);
        
        await log(`\n--- THỰC THI NHIỆM VỤ VÒNG LẶP ---`, 400);
        await log(`[Legal Agent]: Đang quét hồ sơ đính kèm của ${trigger}...`, 400);
        
        if (goal === 'audit_legal') {
          await log(`[Legal Agent]: Đối chiếu với Luật Đầu tư công 58/2024/QH15 và Luật Xây dựng 2025.`, 500);
          await log(`[Legal Agent]: Phát hiện hồ sơ BCNCKT đã đính kèm Tờ trình phê duyệt đúng mẫu.`, 400);
          if (isEnvActive) {
            await log(`[Legal Agent -> Env Agent]: Yêu cầu kiểm tra hồ sơ phê duyệt Báo cáo ĐTM kèm theo.`, 400);
            await log(`[Env Agent]: Đang quét báo cáo ĐTM đối chiếu Luật Bảo vệ môi trường 72/2020/QH14.`, 400);
            await log(`[Env Agent]: Đã tìm thấy quyết định phê duyệt ĐTM số 240/QĐ-BTNMT hợp lệ.`, 400);
          }
        } else if (goal === 'audit_cost') {
          await log(`[Legal Agent -> Cost Agent]: Chuyển hồ sơ dự toán thiết kế cơ sở để thẩm định.`, 500);
          await log(`[Cost Agent]: Đang tra cứu định mức nhân công, ca máy theo Nghị định 10/2021/NĐ-CP...`, 500);
          await log(`[Cost Agent]: Phát hiện sai lệch chi phí thiết bị vượt định mức 12%.`, 400);
          await log(`[Cost Agent -> Legal Agent]: Đề xuất điều chỉnh giảm tổng mức đầu tư xuống 45 tỷ VNĐ.`, 400);
        } else {
          await log(`[Legal Agent -> Risk Agent]: Chuyển hồ sơ để rà soát rủi ro pháp lý & giải ngân.`, 500);
          await log(`[Risk Agent]: Quét cơ sở dữ liệu rủi ro... Phát hiện nguy cơ "Chậm giải phóng mặt bằng".`, 500);
          await log(`[Risk Agent -> Legal Agent]: Đề xuất lập quỹ đền bù đối ứng theo Nghị định 102/2024/NĐ-CP.`, 400);
        }

        if (isRiskActive && goal !== 'audit_risk') {
          await log(`[Risk Agent]: Quét tổng thể rủi ro dự án... Mức độ an toàn đạt 96%.`, 500);
        }

        await log(`\n--- ĐỐI CHIẾU ĐIỀU KIỆN DỪNG (STOP RULE) ---`, 400);
        await log(`[Legal Agent]: Kiểm tra điều kiện dừng: [${stopRule === 'confidence' ? 'Độ tin cậy đạt 96% (> 95%)' : 'Đồng thuận đa tác nhân đạt 100%'}]`, 400);
        await log(`[SYSTEM]: Điều kiện dừng ĐẠT. Đang tổng hợp báo cáo STATE_AUDIT.md...`, 400);
        
        // Compile the state file content
        lastGeneratedStateFile = `# STATE_AUDIT.md - BÁO CÁO GIÁM SÁT VÒNG LẶP AGENTIC
*Thời gian chạy: 14/07/2026 | Phiên bản: LoopEngine 1.0*

## 1. CẤU HÌNH VÒNG LẶP
- **Trigger (Kích hoạt):** ${trigger}
- **Goal (Mục tiêu):** ${goal === 'audit_legal' ? 'Kiểm tra tính pháp lý hồ sơ' : goal === 'audit_cost' ? 'Thẩm định sai lệch dự toán' : 'Đánh giá rủi ro'}
- **Đội ngũ Agents:** Legal Agent, ${isCostActive?'Cost Agent, ':''}${isEnvActive?'Env Agent, ':''}${isRiskActive?'Risk Agent':''}
- **Điều kiện dừng (Stop Rule):** ${stopRule}

## 2. KẾT QUẢ ĐÁNH GIÁ ĐA TÁC NHÂN
- **Hồ sơ Pháp lý:** Đầy đủ, phù hợp với quy định mới của Luật Đầu tư công 58/2024/QH15 và Luật Xây dựng 2025.
- **Dự toán Chi phí:** ${goal === 'audit_cost' ? 'Có sai lệch 12% ở phần thiết bị. Đã kiến nghị sửa đổi giảm trừ định mức.' : 'Hợp lệ, bám sát các định mức ban hành hiện hành.'}
- **Môi trường & ĐTM:** ${isEnvActive ? 'Đã xác thực Quyết định phê duyệt ĐTM số 240/QĐ-BTNMT.' : 'Chưa quét.'}
- **Chỉ số an toàn rủi ro:** 96% (Đạt tiêu chuẩn chất lượng dự án).

## 3. KIẾN NGHỊ HÀNH ĐỘNG
- Cho phép dự án chuyển sang bước tiếp theo trong quy trình Stage-Gate.
- Lưu trữ tài liệu kiểm toán tự động này vào hồ sơ số của dự án.`;

        await log(`[SYSTEM]: Hoàn tất vòng lặp thành công! Đã tạo file trạng thái STATE_AUDIT.md.`, 300);
        
        // Show download state button
        $('#btn-download-state').style.display = 'block';
      })();
    }

    function downloadStateFile() {
      if(!lastGeneratedStateFile) return;
      const blob = new Blob([lastGeneratedStateFile], { type: 'text/markdown;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'STATE_AUDIT.md';
      a.click();
      URL.revokeObjectURL(url);
    }


    // Global state projectType default
    state.projectType = 'all';

    function selectProjectType(type) {
      state.projectType = type;
      
      // Update tab active styling
      $$('.project-tab').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.type === type);
      });
      
      // Re-render and apply dynamic views
      renderAll();
      applyProjectTypeSpecificUpdates(type);
    }

    function applyProjectTypeSpecificUpdates(type) {
      // Clear previous highlights
      $$('.gate-card').forEach(card => {
        card.style.border = '';
        card.style.boxShadow = '';
        const badge = card.querySelector('.project-badge');
        if (badge) badge.remove();
      });
      
      // Highlight gates dynamically
      if (type === 'infra') {
        highlightGate('G0', '🎯 Quy hoạch tuyến');
        highlightGate('G8', '⚠️ GPMB trọng điểm');
        showDynamicAlert('Hạ tầng kỹ thuật: Tập trung vào Gate G0 & G8. Các dự án hạ tầng giao thông/tuyến được miễn Giấy phép xây dựng.');
      } else if (type === 'civil') {
        highlightGate('G1', '🏛️ Thi tuyển kiến trúc');
        highlightGate('G14', '🔥 Thẩm duyệt PCCC bắt buộc');
        showDynamicAlert('Dân dụng: Bắt buộc thi tuyển kiến trúc công trình cấp I/đặc biệt và thẩm duyệt nghiệm thu PCCC nghiêm ngặt tại Gate G14.');
      } else if (type === 'ppp') {
        highlightGate('G5', '🤝 Thỏa thuận PPP');
        highlightGate('G10', '💰 Chọn Nhà đầu tư');
        showDynamicAlert('PPP/BT: Tích hợp làn bơi Nhà đầu tư tư nhân (SPC), đấu thầu lựa chọn nhà đầu tư tại Gate G10 và hợp đồng BOT/BT.');
      } else {
        removeDynamicAlert();
      }
      
      // Adjust BPMN lanes and Risks dynamically
      adjustBpmnLanes(type);
      adjustRisks(type);
    }

    function highlightGate(gateId, label) {
      const card = document.querySelector(`.gate-card[data-gate="${gateId}"]`);
      if (card) {
        card.style.border = '2.5px solid var(--accent)';
        card.style.boxShadow = '0 0 15px rgba(248, 155, 26, 0.4)';
        
        const badge = document.createElement('span');
        badge.className = 'project-badge';
        badge.style.position = 'absolute';
        badge.style.top = '-8px';
        badge.style.right = '4px';
        badge.style.background = 'var(--accent)';
        badge.style.color = '#fff';
        badge.style.fontSize = '9px';
        badge.style.fontWeight = '800';
        badge.style.padding = '2px 6px';
        badge.style.borderRadius = '4px';
        badge.textContent = label;
        card.appendChild(badge);
      }
    }

    function showDynamicAlert(text) {
      removeDynamicAlert();
      const alertDiv = document.createElement('div');
      alertDiv.id = 'dynamic-project-alert';
      alertDiv.style.background = '#fffbeb';
      alertDiv.style.border = '1.5px solid #fef3c7';
      alertDiv.style.borderRadius = '12px';
      alertDiv.style.padding = '14px 20px';
      alertDiv.style.marginBottom = '24px';
      alertDiv.style.fontSize = '13.5px';
      alertDiv.style.fontWeight = '700';
      alertDiv.style.color = '#b45309';
      alertDiv.style.display = 'flex';
      alertDiv.style.alignItems = 'center';
      alertDiv.style.gap = '8px';
      alertDiv.innerHTML = `<span>💡</span> <span>${text}</span>`;
      
      const tabs = document.querySelector('.project-tabs-container');
      if (tabs) {
        tabs.parentNode.insertBefore(alertDiv, tabs.nextSibling);
      }
    }

    function removeDynamicAlert() {
      const alert = document.getElementById('dynamic-project-alert');
      if (alert) alert.remove();
    }

    function adjustBpmnLanes(type) {
      let bpmnData = [...DATA.bpmn];
      if (type === 'ppp') {
        bpmnData.push(
          {order: 5, lane: "Nhà đầu tư tư nhân (SPC)", action: "Góp vốn chủ sở hữu, lập phương án tài chính chi tiết và vận hành BOT/BTO", input: ["Hợp đồng dự án PPP ký kết", "Thiết kế kỹ thuật phê duyệt"], output: ["Báo cáo tiến độ tài chính", "Mô hình vận hành khai thác"], next: "Gate G16", decision: "Không đạt doanh thu -> Điều chỉnh phí"}
        );
      }
      $('#bpmn-list').innerHTML = bpmnData.map(row=>`<div class="lane" style="${row.lane.includes('SPC') ? 'border-left:4px solid var(--accent); background:#fffbeb;' : ''}"><div class="lane-name">${row.order}. ${row.lane}</div><div class="lane-body"><b>${row.action}</b><span><b>Đầu vào:</b> ${(row.input||[]).join('; ')}<br><b>Đầu ra:</b> ${(row.output||[]).join('; ')}</span></div><div class="lane-next"><span><b>Chuyển tiếp:</b> ${row.next}<br><b>Rẽ nhánh:</b> ${row.decision}</span></div></div>`).join('');
    }

    function adjustRisks(type) {
      let risks = [...DATA.risks];
      if (type === 'infra') {
        risks = risks.filter(r => r.description.includes('quy hoạch') || r.description.includes('GPMB') || r.riskGroup.includes('Khảo sát'));
        risks.push({
          level: "Cao", riskId: "R-INF-01", riskGroup: "Kỹ thuật tuyến",
          description: "Khảo sát địa chất dọc tuyến thiếu cơ sở dẫn đến sạt lở hoặc phát sinh đền bù công trình ngầm không xác định dọc tuyến.",
          gate: "G4", probability: "Trung bình", impact: "Lớn", mitigation: "Tăng tần suất khoan địa chất tại các điểm đấu nối quan trọng và quét rada ngầm.", owner: "Tư vấn khảo sát & Chủ đầu tư"
        });
      } else if (type === 'civil') {
        risks = risks.filter(r => r.description.includes('PCCC') || r.description.includes('thiết kế') || r.description.includes('kiến trúc'));
        risks.push({
          level: "Nghiêm trọng", riskId: "R-CIV-01", riskGroup: "Thiết kế & Kiến trúc",
          description: "Phương án kiến trúc không thông qua hội đồng thẩm định thi tuyển quốc gia đối với công trình công cộng cấp I.",
          gate: "G1", probability: "Thấp", impact: "Nghiêm trọng", mitigation: "Tổ chức cuộc thi thi tuyển kiến trúc công khai, mời các chuyên gia đầu ngành trong hội đồng giám khảo.", owner: "UBND chuyên trách & Chủ đầu tư"
        });
      } else if (type === 'ppp') {
        risks = [
          {
            level: "Nghiêm trọng", riskId: "R-PPP-01", riskGroup: "Tài chính công",
            description: "Đứt gãy phương án tài chính do lãi suất vốn vay ngân hàng thương mại tăng đột biến vượt quá dự báo trong Hợp đồng dự án.",
            gate: "G5", probability: "Cao", impact: "Nghiêm trọng", mitigation: "Thỏa thuận trước hạn mức trần lãi suất vay với tổ chức tín dụng bảo trợ và áp dụng cơ chế chia sẻ giảm doanh thu.", owner: "Nhà đầu tư tư nhân & Sở Tài chính"
          },
          {
            level: "Cao", riskId: "R-PPP-02", riskGroup: "Pháp lý hợp đồng",
            description: "Chậm bàn giao quỹ đất thanh toán (đối với dự án BT chuyển tiếp) dẫn đến phát sinh lãi phạt chậm thanh toán của Nhà nước.",
            gate: "G8", probability: "Trung bình", impact: "Lớn", mitigation: "Lập ban chỉ đạo giải phóng mặt bằng riêng biệt trực thuộc UBND thành phố để thúc đẩy đền bù.", owner: "Ban QLDA GPMB & UBND Thành phố"
          }
        ];
      }
      $('#risk-grid').innerHTML = risks.map(r=>`<div class="risk-card" data-level="${r.level}"><span class="risk-level">${r.level}</span><b>${r.riskId} · ${r.riskGroup}</b><p>${r.description}</p><p><b>Gate:</b> ${r.gate} · <b>Xác suất:</b> ${r.probability} · <b>Tác động:</b> ${r.impact}</p><p><b>Ứng phó:</b> ${r.mitigation}</p><p><b>Kiểm soát:</b> ${r.owner}</p></div>`).join('');
    }

    function triggerFileInput() {
      $('#ipo-file-input').click();
    }

    function handleFileSelected(event) {
      const file = event.target.files[0];
      if (file) {
        processIpoAnimation(file.name, 45000000000, 'civil');
      }
    }

    function simulateIpoFile(type) {
      const panel = $('#ipo-result-panel');
      panel.innerHTML = '<div style="text-align:center; color:var(--primary); font-weight:700;"><span class="tag warn" style="animation: pulse 1s infinite;">⚡ AI đang quét tệp tin...</span></div>';
      
      setTimeout(() => {
        if (type === 'totrinh_c') {
          processIpoAnimation('To_trinh_chu_truong_tieu_hoc.pdf', 45000000000, 'civil');
        } else if (type === 'dutoan_c') {
          processIpoAnimation('Ban_ve_&_Du_toan_khu_dan_cu.pdf', 120000000000, 'civil');
        } else {
          processIpoAnimation('Du_toan_thiet_ke_tuyen_duong_trung_tam.pdf', 250000000000, 'infra');
        }
      }, 1000);
    }

    function processIpoAnimation(fileName, cost, projectType) {
      const panel = $('#ipo-result-panel');
      const isOverBudget = cost > 80000000000; // 80 billion threshold
      
      let badgeHtml = '';
      let riskAlertHtml = '';
      
      
      if (isOverBudget) {
        badgeHtml = `<span class="tag danger" style="font-size:11px; font-weight:800;">🚨 LỖI THẨM QUYỀN (OVER AUTHORITY)</span>`;
        riskAlertHtml = `
          <div style="background:#fef2f2; border:1px solid #fee2e2; border-radius:6px; padding:10px; color:#991b1b; font-size:12px; font-weight:700; margin-top:8px;">
            ⚠️ PHÁT HIỆN RỦI RO PHÁP LÝ (REAL-TIME RISK):<br>
            Tổng mức đầu tư (${(cost/1000000000).toFixed(0)} tỷ VNĐ) vượt quá hạn mức phê duyệt của Ủy ban Quận.<br>
            <span style="color:#ef4444; font-weight:800;">Hành động: Yêu cầu chuyển hồ sơ trình UBND Tỉnh/Thành phố phê duyệt.</span>
          </div>
        `;
      } else {
        badgeHtml = `<span class="tag green" style="font-size:11px; font-weight:800;">✓ HỢP LỆ (eKYC Verified)</span>`;
        riskAlertHtml = `
          <div style="background:#f0fdf4; border:1px solid #dcfce7; border-radius:6px; padding:10px; color:#166534; font-size:12px; font-weight:700; margin-top:8px;">
            ✓ THÀNH CÔNG (DATA BEGETS DATA):<br>
            Hệ thống tự động trích xuất dữ liệu, điền sẵn thông tin.
          </div>
        `;
      }
      
      const now = new Date();
      const timestamp = now.toLocaleString('vi-VN');
      const ekycHash = "0x" + Math.random().toString(16).substr(2, 8) + "..." + Math.random().toString(16).substr(2, 8);
      
      panel.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <b style="font-size:12px; color:var(--primary);">📂 BÁO CÁO TRÍCH XUẤT KIỂM TOÁN</b>
          ${badgeHtml}
        </div>
        <div style="font-size:13px; color:var(--text); margin-top:6px; line-height:1.5;">
          <b>Tên tệp:</b> <code style="background:#e2e8f0; padding:2px 6px; border-radius:4px; font-size:11px;">${fileName}</code><br>
          <b>Loại hình nhận diện:</b> ${projectType === 'infra' ? '🏗️ Hạ tầng kỹ thuật' : '🏢 Dân dụng'}<br>
          <b>Tổng chi phí chi tiết:</b> <b style="color:var(--primary);">${(cost/1000000000).toFixed(0)} Tỷ VNĐ</b>
        </div>
        ${riskAlertHtml}
        <div style="margin-top:12px; padding-top:12px; border-top:1px dashed #cbd5e1; font-size:11px; color:#64748b; font-family:monospace;">
          Dấu vết kiểm toán (Audit Trail):<br>
          - ⏱️ Timestamp: ${timestamp}<br>
          - ✍️ Chữ ký số eKYC: Khớp lệ (Agent AI-04)<br>
          - 🔐 Hash (SHA-256): ${ekycHash}
        </div>
      `;
selectProjectType(projectType);
    }

    function bind(){
      const syncSearch = (val)=>{ state.q=val; $('#global-search').value=val; $('#search-step').value=val; renderTable(); };
      $('#global-search').addEventListener('input',e=>syncSearch(e.target.value));
      $('#global-search').addEventListener('keydown',e=>{ if(e.key==='Enter') document.getElementById('lookup').scrollIntoView({behavior: 'smooth'}); });
      $('#btn-global-search').addEventListener('click', () => { document.getElementById('lookup').scrollIntoView({behavior: 'smooth'}); });
      $('#search-step').addEventListener('input',e=>syncSearch(e.target.value));
      $('#filter-stage').onchange=e=>{state.stage=e.target.value; renderTable();};
      $('#filter-gate').onchange=e=>{state.gate=e.target.value; $('#active-gate-pill').textContent = state.gate==='all' ? 'Tất cả Gate' : state.gate; renderFiltered();};
      $('#filter-group').onchange=e=>{state.group=e.target.value; renderTable();};
      $('#filter-agency').onchange=e=>{state.agency=e.target.value; renderTable();};
      $('#filter-risk').onchange=e=>{state.risk=e.target.value; renderTable();};
      $('#check-stage').onchange=e=>{state.checkStage=e.target.value; renderChecks();};
      $('#check-gate').onchange=e=>{state.checkGate=e.target.value; renderChecks();};
      $('#toggle-done').onclick=()=>{state.hideDone=!state.hideDone; $('#toggle-done').textContent = state.hideDone ? 'Hiện hồ sơ đã hoàn thành' : 'Ẩn hồ sơ đã hoàn thành'; renderChecks();};
      $('#clear-checks').onclick=()=>{checked={}; saveChecks(); renderChecks(); renderKpis();};
      const reset = ()=>{ Object.assign(state,{ q:'', stage:'all', gate:'all', group:'all', agency:'all', risk:'all', checkStage:'all', checkGate:'all', hideDone:false });
        checked={}; saveChecks();
        ['global-search','search-step'].forEach(id=>$('#'+id).value='');
        ['filter-stage','filter-gate','filter-group','filter-agency','filter-risk','check-stage','check-gate'].forEach(id=>$('#'+id).value='all');
        $('#toggle-done').textContent='Ẩn hồ sơ đã hoàn thành';
        $('#active-gate-pill').textContent='Tất cả Gate';
        renderAll();
      };
      $('#btn-reset-top').onclick=reset;
      $$('.nav-btn').forEach(btn=>btn.addEventListener('click',()=>{$$('.nav-btn').forEach(x=>x.classList.remove('active')); btn.classList.add('active');}));
      
      // Thư Viện Pháp Luật integration listeners
      $('#btn-tvpl-search').onclick = () => {
        const q = $('#tvpl-search-input').value.trim();
        if(q) {
          window.open('https://thuvienphapluat.vn/page/tim-van-ban.aspx?keyword=' + encodeURIComponent(q) + '&match=True&area=0', '_blank');
        }
      };
      $('#tvpl-search-input').onkeydown = (e) => {
        if(e.key === 'Enter') {
          const q = $('#tvpl-search-input').value.trim();
          if(q) {
            window.open('https://thuvienphapluat.vn/page/tim-van-ban.aspx?keyword=' + encodeURIComponent(q) + '&match=True&area=0', '_blank');
          }
        }
      };
    }

    
    function renderLegalBaseline() {
      const el = $('#legal-baseline-text');
      if (el && DATA.metadata && DATA.metadata.legalBaseline) {
        el.innerHTML = `Mốc pháp lý áp dụng: <b>${DATA.metadata.legalBaseline}</b> | <i>Áp dụng không hồi tố</i>`;
      }
    }

    function renderAll(){ 
      renderLegalBaseline(); 
      renderHero(); 
      renderLayers(); 
      initFilters(); 
      
      // Tối ưu hóa: Trì hoãn việc render các component nặng (dưới màn hình)
      // Giúp trình duyệt rảnh tay để sơn (paint) giao diện màn hình chính ngay lập tức
      setTimeout(() => {
        requestAnimationFrame(() => {
          renderFiltered(); 
          renderAccordion(); 
          renderBpmn(); 
          renderRaci(); 
          renderChecks(); 
          renderKpis(); 
          renderRisks(); 
          renderDigital(); 
          renderLegal(); 
          bindSticky();
        });
      }, 50);
    }

    function bindSticky(){
      const sections = $$('section[id]');
      const links = $$('.nav-btn');
      const obs = new IntersectionObserver((entries)=>{
        entries.forEach(entry=>{
          if(entry.isIntersecting){
            links.forEach(a=>a.classList.toggle('active', a.getAttribute('href') === '#'+entry.target.id || (entry.target.id==='stage-gate' && a.getAttribute('href')==='#stage-gate')));
          }
        })
      },{rootMargin:'-35% 0px -55% 0px'});
      sections.forEach(s=>obs.observe(s));
    }

    renderAll();
    bind();