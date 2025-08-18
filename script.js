document.addEventListener('DOMContentLoaded', () => {
    const formularioLancamento = document.getElementById('formulario-lancamento');
    const tabelaCorpo = document.getElementById('tabela-corpo');
    const btnLimpar = document.getElementById('limpar-dados');
    const menuNavegacao = document.getElementById('menu-navegacao');

    const receitaSpan = document.getElementById('receita-total');
    const despesaSpan = document.getElementById('despesa-total');
    const saldoSpan = document.getElementById('saldo-final');

    // Reserva Modal
    const btnReserva = document.getElementById('btn-reserva');
    const modalReserva = document.getElementById('modal-reserva');
    const spanFechar = modalReserva.querySelector('.fechar');
    const metaReservaModal = document.getElementById('meta-reserva-modal');
    const acumuladoReservaModal = document.getElementById('acumulado-reserva-modal');
    const ctxGraficoReserva = document.getElementById('grafico-reserva');
    let graficoReserva;

    // Objetivos
    const formularioObjetivo = document.getElementById('formulario-objetivo');
    const listaObjetivosDiv = document.getElementById('lista-objetivos');
    const filtroStatusObjetivo = document.getElementById('filtro-status-objetivo');
    const prioridadeObjetivoSelect = document.getElementById('prioridade-objetivo');

    // Histórico
    const filtroDescricao = document.getElementById('filtro-descricao');
    const filtroDataInicio = document.getElementById('filtro-data-inicio');
    const filtroDataFim = document.getElementById('filtro-data-fim');
    const filtroCategoria = document.getElementById('filtro-categoria');

    const btnExportarExcel = document.getElementById('exportar-excel');
    const btnExportarPdf = document.getElementById('exportar-pdf');

    const ctxGraficoDespesas = document.getElementById('grafico-despesas');
    const ctxGraficoDicas = document.getElementById('grafico-dicas');
    let graficoDespesas, graficoDicas;

    // Dados
    let lancamentos = JSON.parse(localStorage.getItem('lancamentos')) || [];
    let metaReserva = parseFloat(localStorage.getItem('metaReserva')) || 0;
    let objetivos = JSON.parse(localStorage.getItem('objetivos')) || [];
    let categorias = JSON.parse(localStorage.getItem('categorias')) || ['Alimentação', 'Moradia', 'Transporte', 'Saúde', 'Lazer', 'Educação', 'Investimento', 'Reserva', 'Salário', 'Outros'];
    let descricoes = JSON.parse(localStorage.getItem('descricoes')) || ['Salário', 'Aluguel', 'Supermercado', 'Energia', 'Água', 'Internet', 'Transporte', 'Lazer', 'Cinema', 'Restaurante'];

    // ---------------- Funções ----------------
    function renderizarCategorias() {
        const listaCategoriasDatalist = document.getElementById('lista-categorias');
        listaCategoriasDatalist.innerHTML = '';
        filtroCategoria.innerHTML = '<option value="">Todas as Categorias</option>';
        categorias.forEach(c => {
            const option = document.createElement('option');
            option.value = c;
            option.textContent = c;
            listaCategoriasDatalist.appendChild(option);

            const optionFiltro = document.createElement('option');
            optionFiltro.value = c;
            optionFiltro.textContent = c;
            filtroCategoria.appendChild(optionFiltro);
        });
    }

    function renderizarDescricoes() {
        const listaDescricoesDatalist = document.getElementById('lista-descricoes');
        listaDescricoesDatalist.innerHTML = '';
        descricoes.forEach(d => {
            const option = document.createElement('option');
            option.value = d;
            listaDescricoesDatalist.appendChild(option);
        });
    }

    function adicionarNovaCategoria(novaCategoria){
        if(novaCategoria.trim() && !categorias.includes(novaCategoria)){
            categorias.push(novaCategoria.trim());
            localStorage.setItem('categorias', JSON.stringify(categorias));
            renderizarCategorias();
        }
    }

    function adicionarNovaDescricao(novaDescricao){
        if(novaDescricao.trim() && !descricoes.includes(novaDescricao)){
            descricoes.push(novaDescricao.trim());
            localStorage.setItem('descricoes', JSON.stringify(descricoes));
            renderizarDescricoes();
        }
    }

    function calcularTotais(){
        let receitaTotal = 0, despesaTotal = 0;
        lancamentos.forEach(l => {
            if(l.tipo==='receita') receitaTotal += parseFloat(l.valor);
            else if(l.tipo==='despesa') despesaTotal += parseFloat(l.valor);
        });
        const saldoFinal = receitaTotal - despesaTotal;
        receitaSpan.textContent = `R$ ${receitaTotal.toFixed(2)}`;
        despesaSpan.textContent = `R$ ${despesaTotal.toFixed(2)}`;
        saldoSpan.textContent = `R$ ${saldoFinal.toFixed(2)}`;
        saldoSpan.style.color = saldoFinal>=0?'#4CAF50':'#f44336';
    }

    function atualizarReservaModal(){
        let valorAcumulado = lancamentos
            .filter(l => l.categoria.toLowerCase() === 'reserva')
            .reduce((sum,l)=>sum+parseFloat(l.valor),0);
        const progresso = metaReserva>0 ? (valorAcumulado/metaReserva*100).toFixed(2) : 0;
        metaReservaModal.textContent = `R$ ${metaReserva.toFixed(2)}`;
        acumuladoReservaModal.textContent = `R$ ${valorAcumulado.toFixed(2)}`;

        if(graficoReserva) graficoReserva.destroy();
        graficoReserva = new Chart(ctxGraficoReserva,{
            type:'doughnut',
            data:{
                labels:['Acumulado','Restante'],
                datasets:[{data:[valorAcumulado, Math.max(metaReserva-valorAcumulado,0)],backgroundColor:['#4CAF50','#ddd'] }]
            },
            options:{responsive:true}
        });
    }

    function renderizarTabela(lancamentosParaExibir){
        tabelaCorpo.innerHTML='';
        (lancamentosParaExibir || lancamentos).forEach((l,i)=>{
            const tr = document.createElement('tr');
            tr.innerHTML=`
                <td data-label="Data">${l.data}</td>
                <td data-label="Descrição">${l.descricao}</td>
                <td data-label="Categoria">${l.categoria}</td>
                <td data-label="Valor">${l.valor.toFixed(2)}</td>
                <td data-label="Tipo">${l.tipo}</td>
                <td><button class="btn-excluir" data-index="${i}">Excluir</button></td>
            `;
            tabelaCorpo.appendChild(tr);
        });
    }

    function renderizarObjetivos(){
        listaObjetivosDiv.innerHTML='';
        let statusFiltro = filtroStatusObjetivo.value;
        objetivos.forEach((obj,i)=>{
            let valorAcumulado = lancamentos
                .filter(l => l.categoria.toLowerCase() === obj.nome.toLowerCase())
                .reduce((sum,l)=>sum+parseFloat(l.valor),0);
            const progresso = obj.meta>0 ? (valorAcumulado/obj.meta*100).toFixed(2):0;
            if(statusFiltro==='pendente' && progresso>=100) return;
            if(statusFiltro==='concluido' && progresso<100) return;

            const progressoCor = progresso>=80?'#4CAF50':progresso>=50?'#FFC107':'#f44336';

            listaObjetivosDiv.innerHTML+=`
                <div class="objetivo-item">
                    <h4>${obj.nome} [${obj.prioridade}]</h4>
                    <p>Meta: R$ ${obj.meta.toFixed(2)}</p>
                    <p>Acumulado: R$ ${valorAcumulado.toFixed(2)}</p>
                    <div class="progresso-bar">
                        <div class="progresso" style="width:${progresso}%; background:${progressoCor}">${progresso}%</div>
                    </div>
                    <button class="btn-adicionar" data-index="${i}">Adicionar Valor</button>
                    <button class="btn-excluir" data-index="${i}">Excluir</button>
                </div>
            `;
        });
    }

    function renderizarGraficoDespesas(){
        const despesasPorCategoria = {};
        lancamentos.forEach(l=>{
            if(l.tipo==='despesa'){
                despesasPorCategoria[l.categoria] = (despesasPorCategoria[l.categoria]||0)+parseFloat(l.valor);
            }
        });
        const labels = Object.keys(despesasPorCategoria);
        const data = Object.values(despesasPorCategoria);
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
            data:{labels,datasets:[{data:dados, backgroundColor:colors}]},
            options:{responsive:true}
        });
    }

    function sincronizarDados(){
        renderizarTabela();
        calcularTotais();
        renderizarGraficoDespesas();
        renderizarObjetivos();
        renderizarGraficoDicas();
        atualizarReservaModal();
    }

    function filtrarLancamentos(){
        const desc=filtroDescricao.value.toLowerCase();
        const dtInicio=filtroDataInicio.value;
        const dtFim=filtroDataFim.value;
        const cat=filtroCategoria.value.toLowerCase();
        const filtrados = lancamentos.filter(l=>{
            return (!desc || l.descricao.toLowerCase().includes(desc)) &&
                   (!dtInicio || l.data>=dtInicio) &&
                   (!dtFim || l.data<=dtFim) &&
                   (!cat || l.categoria.toLowerCase()===cat);
        });
        renderizarTabela(filtrados);
    }

    // ---------------- Eventos ----------------
    menuNavegacao.querySelectorAll('button').forEach(btn=>{
        btn.addEventListener('click',()=>{
            document.querySelectorAll('section').forEach(s=>s.classList.remove('tela-ativa'));
            document.getElementById(btn.dataset.target).classList.add('tela-ativa');
            menuNavegacao.querySelectorAll('button').forEach(b=>b.classList.remove('active'));
            btn.classList.add('active');
        });
    });

    formularioLancamento.addEventListener('submit',(e)=>{
        e.preventDefault();
        const data=document.getElementById('data').value;
        const descricao=document.getElementById('descricao').value;
        const categoria=document.getElementById('categoria').value;
        const valor=parseFloat(document.getElementById('valor').value);
        const tipo=document.getElementById('tipo').value;

        adicionarNovaCategoria(categoria);
        adicionarNovaDescricao(descricao);

        lancamentos.push({data,descricao,categoria,valor,tipo});
        localStorage.setItem('lancamentos',JSON.stringify(lancamentos));

        sincronizarDados();
        formularioLancamento.reset();
    });

    tabelaCorpo.addEventListener('click',(e)=>{
        if(e.target.classList.contains('btn-excluir')){
            const index=parseInt(e.target.dataset.index);
            lancamentos.splice(index,1);
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

    // ---------- Reserva Modal ----------
    btnReserva.addEventListener('click',()=>{ modalReserva.style.display='block'; atualizarReservaModal(); });
    spanFechar.addEventListener('click',()=>{ modalReserva.style.display='none'; });
    window.addEventListener('click', e=>{ if(e.target==modalReserva) modalReserva.style.display='none'; });

    // ---------- Objetivos ----------
    formularioObjetivo.addEventListener('submit',(e)=>{
        e.preventDefault();
        const nome=document.getElementById('nome-objetivo').value;
        const meta=parseFloat(document.getElementById('valor-objetivo').value);
        const prioridade=prioridadeObjetivoSelect.value;
        objetivos.push({nome,meta,prioridade});
        localStorage.setItem('objetivos',JSON.stringify(objetivos));
        formularioObjetivo.reset();
        renderizarObjetivos();
    });

    listaObjetivosDiv.addEventListener('click', e=>{
        const index=parseInt(e.target.dataset.index);
        if(e.target.classList.contains('btn-excluir')){
            objetivos.splice(index,1);
            localStorage.setItem('objetivos',JSON.stringify(objetivos));
            renderizarObjetivos();
        }else if(e.target.classList.contains('btn-adicionar')){
            const valorAdicionado=prompt('Informe o valor a adicionar ao objetivo:');
            const valor=parseFloat(valorAdicionado);
            if(!isNaN(valor) && valor>0){
                lancamentos.push({data:new Date().toISOString().split('T')[0], descricao=objetivos[index].nome, categoria=objetivos[index].nome, valor, tipo:'despesa'});
                localStorage.setItem('lancamentos',JSON.stringify(lancamentos));
                sincronizarDados();
            }
        }
    });

    filtroStatusObjetivo.addEventListener('change', renderizarObjetivos);

    // ---------- Filtros históricos ----------
    filtroDescricao.addEventListener('input', filtrarLancamentos);
    filtroDataInicio.addEventListener('change', filtrarLancamentos);
    filtroDataFim.addEventListener('change', filtrarLancamentos);
    filtroCategoria.addEventListener('change', filtrarLancamentos);

    // Inicialização
    renderizarCategorias();
    renderizarDescricoes();
    sincronizarDados();
});
