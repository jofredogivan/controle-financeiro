document.addEventListener('DOMContentLoaded', () => {
    // Seletores da interface
    const formularioLancamento = document.getElementById('formulario-lancamento');
    const tabelaCorpo = document.getElementById('tabela-corpo');
    const btnLimpar = document.getElementById('limpar-dados');
    const btnDefinirMeta = document.getElementById('definir-meta');
    const formularioObjetivo = document.getElementById('formulario-objetivo');
    const listaObjetivosDiv = document.getElementById('lista-objetivos');
    const listaCategoriasDatalist = document.getElementById('lista-categorias');
    const listaDescricoesDatalist = document.getElementById('lista-descricoes');
    const menuNavegacao = document.getElementById('menu-navegacao');

    const receitaSpan = document.getElementById('receita-total');
    const despesaSpan = document.getElementById('despesa-total');
    const saldoSpan = document.getElementById('saldo-final');
    const metaReservaSpan = document.getElementById('meta-reserva');
    const acumuladoReservaSpan = document.getElementById('acumulado-reserva');
    const progressoReservaSpan = document.getElementById('progresso-reserva');

    const ctxGraficoDespesas = document.getElementById('grafico-despesas');
    let graficoDespesas;

    const filtroDescricao = document.getElementById('filtro-descricao');
    const filtroDataInicio = document.getElementById('filtro-data-inicio');
    const filtroDataFim = document.getElementById('filtro-data-fim');
    const filtroCategoria = document.getElementById('filtro-categoria');

    const btnExportarExcel = document.getElementById('exportar-excel');
    const btnExportarPdf = document.getElementById('exportar-pdf');

    // Estado da aplicação
    let lancamentos = JSON.parse(localStorage.getItem('lancamentos')) || [];
    let metaReserva = parseFloat(localStorage.getItem('metaReserva')) || 0;
    let objetivos = JSON.parse(localStorage.getItem('objetivos')) || [];
    let categorias = JSON.parse(localStorage.getItem('categorias')) || ['Alimentação', 'Moradia', 'Transporte', 'Saúde', 'Lazer', 'Educação', 'Investimento', 'Reserva', 'Salário', 'Outros'];
    let descricoes = JSON.parse(localStorage.getItem('descricoes')) || ['Salário', 'Aluguel', 'Supermercado', 'Energia', 'Água', 'Internet', 'Transporte', 'Lazer', 'Cinema', 'Restaurante'];

    // --- Renderizações ---
    function renderizarCategorias() {
        listaCategoriasDatalist.innerHTML = '';
        filtroCategoria.innerHTML = '<option value="">Todas as Categorias</option>';
        categorias.forEach(c => {
            const option = document.createElement('option');
            option.value = c;
            listaCategoriasDatalist.appendChild(option);

            const optionFiltro = document.createElement('option');
            optionFiltro.value = c;
            filtroCategoria.appendChild(optionFiltro);
        });
    }

    function renderizarDescricoes() {
        listaDescricoesDatalist.innerHTML = '';
        descricoes.forEach(d => {
            const option = document.createElement('option');
            option.value = d;
            listaDescricoesDatalist.appendChild(option);
        });
    }

    function adicionarNovaCategoria(novaCategoria) {
        if (!categorias.includes(novaCategoria) && novaCategoria.trim() !== '') {
            categorias.push(novaCategoria.trim());
            localStorage.setItem('categorias', JSON.stringify(categorias));
            renderizarCategorias();
        }
    }

    function adicionarNovaDescricao(novaDescricao) {
        if (!descricoes.includes(novaDescricao) && novaDescricao.trim() !== '') {
            descricoes.push(novaDescricao.trim());
            localStorage.setItem('descricoes', JSON.stringify(descricoes));
            renderizarDescricoes();
        }
    }

    function renderizarTabela(lancamentosParaExibir) {
        tabelaCorpo.innerHTML = '';
        const lista = lancamentosParaExibir || lancamentos;
        lista.forEach((l, index) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td data-label="Data">${l.data}</td>
                <td data-label="Descrição">${l.descricao}</td>
                <td data-label="Categoria">${l.categoria}</td>
                <td data-label="Valor">${l.valor}</td>
                <td data-label="Tipo">${l.tipo}</td>
                <td><button class="btn-excluir" data-index="${index}">Excluir</button></td>
            `;
            tabelaCorpo.appendChild(tr);
        });
    }

    function atualizarTotais() {
        let receita = 0, despesa = 0;
        lancamentos.forEach(l => l.tipo==='receita'? receita+=parseFloat(l.valor) : despesa+=parseFloat(l.valor));
        const saldo = receita - despesa;
        receitaSpan.textContent = `R$ ${receita.toFixed(2)}`;
        despesaSpan.textContent = `R$ ${despesa.toFixed(2)}`;
        saldoSpan.textContent = `R$ ${saldo.toFixed(2)}`;
        saldoSpan.style.color = saldo>=0 ? '#4CAF50' : '#f44336';
    }

    function atualizarReserva() {
        let acumulado = 0;
        lancamentos.forEach(l => { if(l.categoria.toLowerCase()==='reserva') acumulado+=parseFloat(l.valor); });
        const progresso = metaReserva>0? ((acumulado/metaReserva)*100).toFixed(2) : 0;
        metaReservaSpan.textContent = `R$ ${metaReserva.toFixed(2)}`;
        acumuladoReservaSpan.textContent = `R$ ${acumulado.toFixed(2)}`;
        progressoReservaSpan.textContent = `${progresso}%`;
        progressoReservaSpan.style.color = progresso>=100? '#4CAF50' : '#333';
    }

    function renderizarObjetivos() {
        listaObjetivosDiv.innerHTML = '';
        objetivos.forEach((obj, i) => {
            let acumulado=0;
            lancamentos.forEach(l => { if(l.categoria.toLowerCase()===obj.nome.toLowerCase()) acumulado+=parseFloat(l.valor); });
            const progresso = obj.meta>0? ((acumulado/obj.meta)*100).toFixed(2) : 0;
            listaObjetivosDiv.innerHTML += `
                <div class="objetivo-item">
                    <h4>${obj.nome}</h4>
                    <p>Meta: R$ ${obj.meta.toFixed(2)}</p>
                    <p>Acumulado: R$ ${acumulado.toFixed(2)}</p>
                    <div class="progresso-bar">
                        <div class="progresso" style="width: ${progresso}%;">${progresso}%</div>
                    </div>
                    <button class="btn-excluir" data-index="${i}">Excluir</button>
                </div>
            `;
        });
    }

    function renderizarGraficoDespesas() {
        const despesasPorCategoria = {};
        lancamentos.forEach(l => {
            if(l.tipo==='despesa'){
                const cat = l.categoria.toLowerCase();
                despesasPorCategoria[cat] = (despesasPorCategoria[cat]||0)+parseFloat(l.valor);
            }
        });

        const labels = Object.keys(despesasPorCategoria);
        const data = Object.values(despesasPorCategoria);
        const cores = ['#FF6384','#36A2EB','#FFCE56','#4BC0C0','#9966FF','#FF9F40','#E7E9ED','#8B5F65'];

        const chartData = { labels, datasets:[{data, backgroundColor: cores}] };
        if(graficoDespesas) graficoDespesas.destroy();
        graficoDespesas = new Chart(ctxGraficoDespesas, {
            type: 'doughnut',
            data: chartData,
            options: {
                responsive:true,
                plugins:{
                    legend:{ position:'top' },
                    tooltip:{ callbacks:{ label: t=>`${t.label}: R$ ${t.raw.toFixed(2)}` } }
                }
            }
        });
    }

    // --- Sincronização e filtros ---
    function sincronizarDados(){
        atualizarTotais();
        atualizarReserva();
        renderizarObjetivos();
        renderizarGraficoDespesas();
    }

    function filtrarLancamentos(){
        const dBusca = filtroDescricao.value.toLowerCase();
        const dInicio = filtroDataInicio.value;
        const dFim = filtroDataFim.value;
        const cat = filtroCategoria.value.toLowerCase();

        const filtrados = lancamentos.filter(l => {
            const desc=l.descricao.toLowerCase();
            const categoria=l.categoria.toLowerCase();
            const data=l.data;
            return desc.includes(dBusca) && (cat===''||categoria===cat) && (!dInicio||data>=dInicio) && (!dFim||data<=dFim);
        });
        renderizarTabela(filtrados);
    }

    // --- Exportação ---
    function exportarParaExcel(){
        const tabela = document.querySelector('table');
        const html = tabela.outerHTML;
        const nome = `lancamentos-${new Date().toISOString().split('T')[0]}.xls`;
        const uri='data:application/vnd.ms-excel;base64,';
        const template='<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head></head><body><table>{table}</table></body></html>';
        const base64 = s=>window.btoa(unescape(encodeURIComponent(s)));
        const format = (s,c)=>s.replace(/{(\w+)}/g,(m,p)=>c[p]);
        const ctx={ worksheet:'Histórico de Lançamentos', table: html };
        const link = document.createElement('a');
        link.href = uri+base64(format(template,ctx));
        link.download = nome;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    function exportarParaPDF(){
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        doc.text("Histórico de Lançamentos",10,10);
        doc.html(document.querySelector('table'),{
            callback: doc=>doc.save('historico-lancamentos.pdf'),
            x:10,y:20, html2canvas:{ scale:0.25 }
        });
    }

    // --- Eventos ---
    formularioLancamento.addEventListener('submit', e=>{
        e.preventDefault();
        const novaCategoria = document.getElementById('categoria').value;
        const novaDescricao = document.getElementById('descricao').value;
        adicionarNovaCategoria(novaCategoria);
        adicionarNovaDescricao(novaDescricao);

        lancamentos.push({
            data: document.getElementById('data').value,
            descricao: novaDescricao,
            categoria: novaCategoria,
            valor: parseFloat(document.getElementById('valor').value).toFixed(2),
            tipo: document.getElementById('tipo').value
        });
        localStorage.setItem('lancamentos',JSON.stringify(lancamentos));
        formularioLancamento.reset();
        renderizarTabela();
        sincronizarDados();
    });

    formularioObjetivo.addEventListener('submit', e=>{
        e.preventDefault();
        const nome = document.getElementById('nome-objetivo').value;
        const valor = parseFloat(document.getElementById('valor-objetivo').value);
        adicionarNovaCategoria(nome);
        if(nome && !isNaN(valor) && valor>0){
            objetivos.push({ nome, meta: valor });
            localStorage.setItem('objetivos', JSON.stringify(objetivos));
            formularioObjetivo.reset();
            renderizarObjetivos();
            sincronizarDados();
        } else alert("Preencha todos os campos corretamente.");
    });

    tabelaCorpo.addEventListener('click', e=>{
        if(e.target.classList.contains('btn-excluir')){
            const i = e.target.getAttribute('data-index');
            lancamentos.splice(i,1);
            localStorage.setItem('lancamentos', JSON.stringify(lancamentos));
            renderizarTabela();
            sincronizarDados();
        }
    });

    listaObjetivosDiv.addEventListener('click', e=>{
        if(e.target.classList.contains('btn-excluir')){
            const i = e.target.getAttribute('data-index');
            objetivos.splice(i,1);
            localStorage.setItem('objetivos', JSON.stringify(objetivos));
            renderizarObjetivos();
            sincronizarDados();
        }
    });

    btnLimpar.addEventListener('click', ()=>{
        if(confirm("Deseja limpar todos os dados?")){
            lancamentos = [];
            metaReserva = 0;
            objetivos = [];
            localStorage.clear();
            renderizarTabela();
            renderizarCategorias();
            renderizarDescricoes();
            sincronizarDados();
        }
    });

    btnDefinirMeta.addEventListener('click', ()=>{
        const novaMeta = prompt("Digite o valor da sua meta de reserva de emergência:");
        if(novaMeta && !isNaN(novaMeta) && parseFloat(novaMeta)>=0){
            metaReserva = parseFloat(novaMeta);
            localStorage.setItem('metaReserva', metaReserva);
            sincronizarDados();
        } else alert("Valor inválido.");
    });

    filtroDescricao.addEventListener('input', filtrarLancamentos);
    filtroDataInicio.addEventListener('input', filtrarLancamentos);
    filtroDataFim.addEventListener('input', filtrarLancamentos);
    filtroCategoria.addEventListener('change', filtrarLancamentos);

    btnExportarExcel.addEventListener('click', exportarParaExcel);
    btnExportarPdf.addEventListener('click', exportarParaPDF);

    // --- Navegação lateral ---
    function irParaTela(idTela){
        const telas = document.querySelectorAll('.tela');
        telas.forEach(t => t.id===idTela? t.classList.add('ativa') : t.classList.remove('ativa'));
        document.querySelectorAll('#menu-navegacao button').forEach(b=>b.classList.remove('active'));
        document.querySelector(`#menu-navegacao button[data-tela="${idTela}"]`).classList.add('active');
        sincronizarDados();
        if(idTela==='historico') renderizarTabela();
    }

    menuNavegacao.addEventListener('click', e=>{
        const btn = e.target.closest('button');
        if(btn) irParaTela(btn.getAttribute('data-tela'));
    });

    // --- Inicialização ---
    renderizarCategorias();
    renderizarDescricoes();
    sincronizarDados();
    irParaTela('lancamento');
});
