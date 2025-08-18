document.addEventListener('DOMContentLoaded', () => {
    // ----- Elementos -----
    const formularioLancamento = document.getElementById('formulario-lancamento');
    const tabelaCorpo = document.getElementById('tabela-corpo');
    const btnLimpar = document.getElementById('limpar-dados');
    const btnDefinirMeta = document.getElementById('definir-meta');
    const formularioObjetivo = document.getElementById('formulario-objetivo');
    const listaObjetivosDiv = document.getElementById('lista-objetivos');
    const listaCategoriasDatalist = document.getElementById('lista-categorias');
    const listaDescricoesDatalist = document.getElementById('lista-descricoes');
    const menuNavegacao = document.getElementById('menu-navegacao');
    const filtroStatusObjetivo = document.getElementById('filtro-status-objetivo');
    
    const receitaSpan = document.getElementById('receita-total');
    const despesaSpan = document.getElementById('despesa-total');
    const saldoSpan = document.getElementById('saldo-final');
    const metaReservaSpan = document.getElementById('meta-reserva');
    const acumuladoReservaSpan = document.getElementById('acumulado-reserva');
    
    const filtroDescricao = document.getElementById('filtro-descricao');
    const filtroDataInicio = document.getElementById('filtro-data-inicio');
    const filtroDataFim = document.getElementById('filtro-data-fim');
    const filtroCategoria = document.getElementById('filtro-categoria');

    const ctxGraficoDespesas = document.getElementById('grafico-despesas');
    const ctxGraficoDicas = document.getElementById('grafico-dicas');
    const ctxGraficoReserva = document.getElementById('grafico-reserva');
    const modalReserva = document.getElementById('reserva-modal');
    const spanFechar = modalReserva.querySelector('.fechar');

    let graficoDespesas, graficoDicas, graficoReserva;

    // ----- Dados -----
    let lancamentos = JSON.parse(localStorage.getItem('lancamentos')) || [];
    let metaReserva = parseFloat(localStorage.getItem('metaReserva')) || 0;
    let objetivos = JSON.parse(localStorage.getItem('objetivos')) || [];
    let categorias = JSON.parse(localStorage.getItem('categorias')) || ['Alimentação', 'Moradia', 'Transporte', 'Saúde', 'Lazer', 'Educação', 'Investimento', 'Reserva', 'Salário', 'Outros'];
    let descricoes = JSON.parse(localStorage.getItem('descricoes')) || ['Salário', 'Aluguel', 'Supermercado', 'Energia', 'Água', 'Internet', 'Transporte', 'Lazer', 'Cinema', 'Restaurante'];

    // ----- Funções Auxiliares -----
    function renderizarCategorias() {
        listaCategoriasDatalist.innerHTML = '';
        filtroCategoria.innerHTML = '<option value="">Todas as Categorias</option>';
        categorias.forEach(categoria => {
            const option = document.createElement('option');
            option.value = categoria;
            option.textContent = categoria;
            listaCategoriasDatalist.appendChild(option);

            const optionFiltro = document.createElement('option');
            optionFiltro.value = categoria;
            optionFiltro.textContent = categoria;
            filtroCategoria.appendChild(optionFiltro);
        });
    }

    function renderizarDescricoes() {
        listaDescricoesDatalist.innerHTML = '';
        descricoes.forEach(desc => {
            const option = document.createElement('option');
            option.value = desc;
            listaDescricoesDatalist.appendChild(option);
        });
    }

    function adicionarNovaCategoria(categoria) {
        if(categoria.trim() && !categorias.includes(categoria.trim())){
            categorias.push(categoria.trim());
            localStorage.setItem('categorias', JSON.stringify(categorias));
            renderizarCategorias();
        }
    }

    function adicionarNovaDescricao(descricao) {
        if(descricao.trim() && !descricoes.includes(descricao.trim())){
            descricoes.push(descricao.trim());
            localStorage.setItem('descricoes', JSON.stringify(descricoes));
            renderizarDescricoes();
        }
    }

    function calcularTotais(){
        let receita=0, despesa=0;
        lancamentos.forEach(l=>{
            if(l.tipo==='receita') receita+=parseFloat(l.valor);
            else despesa+=parseFloat(l.valor);
        });
        const saldo = receita - despesa;
        receitaSpan.textContent = `R$ ${receita.toFixed(2)}`;
        despesaSpan.textContent = `R$ ${despesa.toFixed(2)}`;
        saldoSpan.textContent = `R$ ${saldo.toFixed(2)}`;
        saldoSpan.style.color = saldo>=0 ? '#4CAF50' : '#f44336';
    }

    function renderizarTabela(lancamentosParaExibir){
        tabelaCorpo.innerHTML = '';
        const lista = lancamentosParaExibir || lancamentos;
        lista.forEach((l,i)=>{
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td data-label="Data">${l.data}</td>
                <td data-label="Descrição">${l.descricao}</td>
                <td data-label="Categoria">${l.categoria}</td>
                <td data-label="Valor">${l.valor}</td>
                <td data-label="Tipo">${l.tipo}</td>
                <td>
                    <button class="btn-excluir" data-index="${i}">Excluir</button>
                </td>
            `;
            tabelaCorpo.appendChild(tr);
        });
    }

    function renderizarObjetivos(){
        listaObjetivosDiv.innerHTML = '';
        let statusFiltro = filtroStatusObjetivo.value;
        objetivos.forEach((o,i)=>{
            let acumulado = lancamentos.filter(l=>l.categoria===o.nome && l.tipo==='despesa')
                .reduce((s,l)=>s+parseFloat(l.valor),0);
            let progresso = o.meta>0 ? ((acumulado/o.meta)*100).toFixed(2) : 0;

            if(statusFiltro==='pendente' && progresso>=100) return;
            if(statusFiltro==='concluido' && progresso<100) return;

            let cor = o.prioridade==='Alta' ? '#f44336' : o.prioridade==='Média' ? '#ff9800' : '#4CAF50';

            listaObjetivosDiv.innerHTML += `
                <div class="objetivo-item" data-index="${i}">
                    <input type="text" class="nome-objetivo-input" value="${o.nome}">
                    <input type="number" class="meta-objetivo-input" value="${o.meta.toFixed(2)}">
                    <p>Progresso: <span style="color:${cor}">${progresso}%</span></p>
                    <div class="progresso-bar">
                        <div class="progresso" style="width:${progresso}%;background:${cor}"></div>
                    </div>
                    <button class="btn-adicionar" data-index="${i}">Adicionar Valor</button>
                    <button class="btn-excluir" data-index="${i}">Excluir</button>
                </div>
            `;
        });
    }

    function renderizarGraficoDespesas(){
        const dataCat = {};
        lancamentos.forEach(l=>{
            if(l.tipo==='despesa') dataCat[l.categoria] = (dataCat[l.categoria]||0)+parseFloat(l.valor);
        });
        const labels = Object.keys(dataCat);
        const data = Object.values(dataCat);
        const colors = ['#FF6384','#36A2EB','#FFCE56','#4BC0C0','#9966FF','#FF9F40','#E7E9ED','#8B5F65'];
        if(graficoDespesas) graficoDespesas.destroy();
        graficoDespesas = new Chart(ctxGraficoDespesas,{
            type:'doughnut',
            data:{labels,datasets:[{data,backgroundColor:colors}]},
            options:{responsive:true}
        });
    }

    function renderizarGraficoDicas(){
        const dados=[50,30,20], labels=['Essenciais','Lazer','Poupança'], colors=['#4caf50','#ff9800','#2196f3'];
        if(graficoDicas) graficoDicas.destroy();
        graficoDicas = new Chart(ctxGraficoDicas,{
            type:'doughnut',
            data:{labels,datasets:[{data:dados,backgroundColor:colors}]},
            options:{responsive:true}
        });
    }

    function atualizarReserva(){
        let acumulado = lancamentos.filter(l=>l.categoria==='Reserva' && l.tipo==='despesa')
            .reduce((s,l)=>s+parseFloat(l.valor),0);
        metaReservaSpan.textContent = `R$ ${metaReserva.toFixed(2)}`;
        acumuladoReservaSpan.textContent = `R$ ${acumulado.toFixed(2)}`;
        if(graficoReserva) graficoReserva.destroy();
        graficoReserva = new Chart(ctxGraficoReserva,{
            type:'doughnut',
            data:{labels:['Acumulado','Faltante'],datasets:[{data:[acumulado,Math.max(metaReserva-acumulado,0)],backgroundColor:['#4CAF50','#f44336']}]},
            options:{responsive:true}
        });
    }

    function sincronizarDados(){
        calcularTotais();
        renderizarTabela();
        renderizarObjetivos();
        renderizarGraficoDespesas();
        renderizarGraficoDicas();
        atualizarReserva();
    }

    function filtrarLancamentos(){
        const desc = filtroDescricao.value.toLowerCase();
        const dataInicio = filtroDataInicio.value;
        const dataFim = filtroDataFim.value;
        const cat = filtroCategoria.value.toLowerCase();
        const filtrados = lancamentos.filter(l=>{
            const dOk = !desc || l.descricao.toLowerCase().includes(desc);
            const dtOk = (!dataInicio || l.data>=dataInicio) && (!dataFim || l.data<=dataFim);
            const cOk = !cat || l.categoria.toLowerCase()===cat;
            return dOk && dtOk && cOk;
        });
        renderizarTabela(filtrados);
    }

    // ----- Eventos -----
    menuNavegacao.querySelectorAll('button').forEach(btn=>{
        btn.addEventListener('click',()=>{
            if(btn.dataset.target==='reserva-modal'){
                modalReserva.style.display='block';
                atualizarReserva();
                return;
            }
            document.querySelectorAll('section').forEach(sec=>sec.classList.remove('tela-ativa'));
            document.getElementById(btn.dataset.target).classList.add('tela-ativa');
            menuNavegacao.querySelectorAll('button').forEach(b=>b.classList.remove('active'));
            btn.classList.add('active');
        });
    });

    spanFechar.onclick = () => modalReserva.style.display='none';
    window.onclick = e => { if(e.target===modalReserva) modalReserva.style.display='none'; };

    formularioLancamento.addEventListener('submit', e=>{
        e.preventDefault();
        const data = document.getElementById('data').value;
        const descricao = document.getElementById('descricao').value;
        const categoria = document.getElementById('categoria').value;
        const valor = parseFloat(document.getElementById('valor').value);
        const tipo = document.getElementById('tipo').value;

        adicionarNovaCategoria(categoria);
        adicionarNovaDescricao(descricao);

        lancamentos.push({data,descricao,categoria,valor,tipo});
        localStorage.setItem('lancamentos',JSON.stringify(lancamentos));
        sincronizarDados();
        formularioLancamento.reset();
    });

    tabelaCorpo.addEventListener('click', e=>{
        if(e.target.classList.contains('btn-excluir')){
            const i=parseInt(e.target.dataset.index);
            lancamentos.splice(i,1);
            localStorage.setItem('lancamentos',JSON.stringify(lancamentos));
            sincronizarDados();
        }
    });

    btnLimpar.addEventListener('click',()=>{
        if(confirm('Deseja realmente limpar todos os dados?')){
            lancamentos=[];
            objetivos=[];
            metaReserva=0;
            localStorage.clear();
            sincronizarDados();
        }
    });

    btnDefinirMeta.addEventListener('click', ()=>{
        const novaMeta=parseFloat(prompt('Defina o valor da reserva de emergência:'));
        if(!isNaN(novaMeta)){
            metaReserva = novaMeta;
            localStorage.setItem('metaReserva',metaReserva);
            atualizarReserva();
        }
    });

    formularioObjetivo.addEventListener('submit', e=>{
        e.preventDefault();
        const nome = document.getElementById('nome-objetivo').value;
        const meta = parseFloat(document.getElementById('valor-objetivo').value);
        const prioridade = document.getElementById('prioridade-objetivo').value;
        objetivos.push({nome,meta,prioridade});
        localStorage.setItem('objetivos',JSON.stringify(objetivos));
        renderizarObjetivos();
        formularioObjetivo.reset();
    });

    listaObjetivosDiv.addEventListener('click', e=>{
        const idx = parseInt(e.target.dataset.index);
        if(e.target.classList.contains('btn-excluir')){
            objetivos.splice(idx,1);
            localStorage.setItem('objetivos',JSON.stringify(objetivos));
            renderizarObjetivos();
        } else if(e.target.classList.contains('btn-adicionar')){
            const valor = parseFloat(prompt('Digite o valor a adicionar ao objetivo:'));
            if(!isNaN(valor)){
                lancamentos.push({data:new Date().toISOString().split('T')[0],descricao:`Depósito ${objetivos[idx].nome}`,categoria:objetivos[idx].nome,valor,tipo:'despesa'});
                localStorage.setItem('lancamentos',JSON.stringify(lancamentos));
                renderizarObjetivos();
                sincronizarDados();
            }
        }
    });

    listaObjetivosDiv.addEventListener('input', e=>{
        const parent = e.target.closest('.objetivo-item');
        const idx = parseInt(parent.dataset.index);
        if(e.target.classList.contains('nome-objetivo-input')){
            objetivos[idx].nome = e.target.value;
        } else if(e.target.classList.contains('meta-objetivo-input')){
            objetivos[idx].meta = parseFloat(e.target.value);
        }
        localStorage.setItem('objetivos',JSON.stringify(objetivos));
        renderizarObjetivos();
    });

    filtroStatusObjetivo.addEventListener('change', renderizarObjetivos);

    filtroDescricao.addEventListener('input', filtrarLancamentos);
    filtroDataInicio.addEventListener('input', filtrarLancamentos);
    filtroDataFim.addEventListener('input', filtrarLancamentos);
    filtroCategoria.addEventListener('change', filtrarLancamentos);

    // ----- Inicialização -----
    renderizarCategorias();
    renderizarDescricoes();
    sincronizarDados();
});
