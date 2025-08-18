document.addEventListener('DOMContentLoaded', () => {
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

    const filtroDescricao = document.getElementById('filtro-descricao');
    const filtroDataInicio = document.getElementById('filtro-data-inicio');
    const filtroDataFim = document.getElementById('filtro-data-fim');
    const filtroCategoria = document.getElementById('filtro-categoria');

    const btnExportarExcel = document.getElementById('exportar-excel');
    const btnExportarPdf = document.getElementById('exportar-pdf');

    const ctxGraficoDespesas = document.getElementById('grafico-despesas');
    let graficoDespesas;

    const ctxGraficoDicas = document.getElementById('grafico-dicas');
    let graficoDicas;

    let lancamentos = JSON.parse(localStorage.getItem('lancamentos')) || [];
    let metaReserva = parseFloat(localStorage.getItem('metaReserva')) || 0;
    let objetivos = JSON.parse(localStorage.getItem('objetivos')) || [];
    let categorias = JSON.parse(localStorage.getItem('categorias')) || ['Alimentação', 'Moradia', 'Transporte', 'Saúde', 'Lazer', 'Educação', 'Investimento', 'Reserva', 'Salário', 'Outros'];
    let descricoes = JSON.parse(localStorage.getItem('descricoes')) || ['Salário', 'Aluguel', 'Supermercado', 'Energia', 'Água', 'Internet', 'Transporte', 'Lazer', 'Cinema', 'Restaurante'];

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
        descricoes.forEach(descricao => {
            const option = document.createElement('option');
            option.value = descricao;
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

    function calcularDisponivel() {
        let totalReserva = 0;
        objetivos.forEach(obj => {
            totalReserva += obj.meta;
        });

        const acumuladoReserva = lancamentos
            .filter(l => l.categoria.toLowerCase() === 'reserva')
            .reduce((sum, l) => sum + parseFloat(l.valor), 0);

        return acumuladoReserva - totalReserva;
    }

    function renderizarTabela(lancamentosParaExibir) {
        tabelaCorpo.innerHTML = '';
        const lancamentosRenderizados = lancamentosParaExibir || lancamentos;
        lancamentosRenderizados.forEach((lancamento, index) => {
            const novaLinha = document.createElement('tr');
            novaLinha.innerHTML = `
                <td data-label="Data">${lancamento.data}</td>
                <td data-label="Descrição">${lancamento.descricao}</td>
                <td data-label="Categoria">${lancamento.categoria}</td>
                <td data-label="Valor">${lancamento.valor}</td>
                <td data-label="Tipo">${lancamento.tipo}</td>
                <td><button class="btn-excluir" data-index="${index}">Excluir</button></td>
            `;
            tabelaCorpo.appendChild(novaLinha);
        });
    }

    function atualizarTotais() {
    let receitaTotal = 0;
    let despesaTotal = 0;

    lancamentos.forEach(lancamento => {
        // Valores de categoria "reserva" sempre como despesa
        if (lancamento.categoria.toLowerCase() === 'reserva') {
            despesaTotal += parseFloat(lancamento.valor);
        } else if (lancamento.tipo === 'receita') {
            receitaTotal += parseFloat(lancamento.valor);
        } else if (lancamento.tipo === 'despesa') {
            despesaTotal += parseFloat(lancamento.valor);
        }
    });

    const saldoFinal = receitaTotal - despesaTotal;

    receitaSpan.textContent = `R$ ${receitaTotal.toFixed(2)}`;
    despesaSpan.textContent = `R$ ${despesaTotal.toFixed(2)}`;
    saldoSpan.textContent = `R$ ${saldoFinal.toFixed(2)}`;
    saldoSpan.style.color = saldoFinal >= 0 ? '#4CAF50' : '#f44336';

    }

    function atualizarReserva() {
        let valorAcumulado = 0;
        lancamentos.forEach(lancamento => {
            if (lancamento.categoria.toLowerCase() === 'reserva') {
                valorAcumulado += parseFloat(lancamento.valor);
            }
        });

        const progresso = (metaReserva > 0) ? ((valorAcumulado / metaReserva) * 100).toFixed(2) : 0;
        metaReservaSpan.textContent = `R$ ${metaReserva.toFixed(2)}`;
        acumuladoReservaSpan.textContent = `R$ ${valorAcumulado.toFixed(2)}`;
        progressoReservaSpan.textContent = `${progresso}%`;
        progressoReservaSpan.style.color = progresso >= 100 ? '#4CAF50' : '#333';
    }

    function renderizarObjetivos() {
        listaObjetivosDiv.innerHTML = '';
        objetivos.forEach((objetivo, index) => {
            let valorAcumulado = lancamentos
                .filter(l => l.categoria.toLowerCase() === objetivo.nome.toLowerCase())
                .reduce((sum, l) => sum + parseFloat(l.valor), 0);
            const progresso = (objetivo.meta > 0) ? ((valorAcumulado / objetivo.meta) * 100).toFixed(2) : 0;
            listaObjetivosDiv.innerHTML += `
                <div class="objetivo-item">
                    <h4>${objetivo.nome}</h4>
                    <p>Meta: R$ ${objetivo.meta.toFixed(2)}</p>
                    <p>Acumulado: R$ ${valorAcumulado.toFixed(2)}</p>
                    <div class="progresso-bar">
                        <div class="progresso" style="width: ${progresso}%;">${progresso}%</div>
                    </div>
                    <button class="btn-excluir" data-index="${index}">Excluir</button>
                </div>
            `;
        });
    }

    function renderizarGraficoDespesas() {
        const despesasPorCategoria = {};
        lancamentos.forEach(l => {
            if (l.tipo === 'despesa') {
                const cat = l.categoria.toLowerCase();
                despesasPorCategoria[cat] = (despesasPorCategoria[cat] || 0) + parseFloat(l.valor);
            }
        });

        const labels = Object.keys(despesasPorCategoria);
        const data = Object.values(despesasPorCategoria);
        const colors = ['#FF6384','#36A2EB','#FFCE56','#4BC0C0','#9966FF','#FF9F40','#E7E9ED','#8B5F65'];

        if (graficoDespesas) graficoDespesas.destroy();

        graficoDespesas = new Chart(ctxGraficoDespesas, {
            type: 'doughnut',
            data: { labels, datasets: [{ data, backgroundColor: colors }] },
            options: { responsive: true }
        });
    }

    function renderizarGraficoDicas() {
        const dados = [50,30,20];
        const labels = ['Essenciais','Lazer','Poupança'];
        const colors = ['#4caf50','#ff9800','#2196f3'];

        if(graficoDicas) graficoDicas.destroy();

        graficoDicas = new Chart(ctxGraficoDicas, {
            type: 'doughnut',
            data: { labels, datasets: [{ data: dados, backgroundColor: colors }] },
            options: { responsive: true }
        });
    }

    function sincronizarDados() {
        atualizarTotais();
        renderizarGraficoDespesas();
        atualizarReserva();
        renderizarObjetivos();
        renderizarGraficoDicas();
    }

    function filtrarLancamentos() {
        const descricaoBusca = filtroDescricao.value.toLowerCase();
        const dataInicio = filtroDataInicio.value;
        const dataFim = filtroDataFim.value;
        const categoriaBusca = filtroCategoria.value.toLowerCase();

        const filtrados = lancamentos.filter(l => {
            const descOk = l.descricao.toLowerCase().includes(descricaoBusca);
            const dataOk = (!dataInicio || l.data >= dataInicio) && (!dataFim || l.data <= dataFim);
            const catOk = !categoriaBusca || l.categoria.toLowerCase() === categoriaBusca;
            return descOk && dataOk && catOk;
        });

        renderizarTabela(filtrados);
    }

    // Eventos
    menuNavegacao.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('section').forEach(sec => sec.classList.remove('tela-ativa'));
            document.getElementById(btn.dataset.target).classList.add('tela-ativa');
            menuNavegacao.querySelectorAll('button').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });

    formularioLancamento.addEventListener('submit', (e) => {
        e.preventDefault();
        const data = document.getElementById('data').value;
        const descricao = document.getElementById('descricao').value;
        const categoria = document.getElementById('categoria').value;
        const valor = parseFloat(document.getElementById('valor').value);
        const tipo = document.getElementById('tipo').value;

        adicionarNovaCategoria(categoria);
        adicionarNovaDescricao(descricao);

        const disponivel = calcularDisponivel();
        if(tipo === 'despesa' && categoria.toLowerCase() === 'reserva' && valor > disponivel){
            alert(`Não é possível retirar R$ ${valor.toFixed(2)} da reserva. Disponível: R$ ${disponivel.toFixed(2)}`);
            return;
        }

        lancamentos.push({ data, descricao, categoria, valor, tipo });
        localStorage.setItem('lancamentos', JSON.stringify(lancamentos));

        renderizarTabela();
        sincronizarDados();
        formularioLancamento.reset();
    });

    tabelaCorpo.addEventListener('click', (e) => {
        if(e.target.classList.contains('btn-excluir')){
            const index = parseInt(e.target.dataset.index);
            lancamentos.splice(index, 1);
            localStorage.setItem('lancamentos', JSON.stringify(lancamentos));
            renderizarTabela();
            sincronizarDados();
        }
    });

    btnLimpar.addEventListener('click', () => {
        if(confirm('Deseja realmente limpar todos os dados?')){
            lancamentos = [];
            objetivos = [];
            metaReserva = 0;
            localStorage.clear();
            renderizarTabela();
            sincronizarDados();
        }
    });

    btnDefinirMeta.addEventListener('click', () => {
        const novaMeta = parseFloat(prompt('Defina o valor da sua reserva de emergência:'));
        if(!isNaN(novaMeta)){
            metaReserva = novaMeta;
            localStorage.setItem('metaReserva', metaReserva);
            sincronizarDados();
        }
    });

    formularioObjetivo.addEventListener('submit', (e) => {
        e.preventDefault();
        const nome = document.getElementById('nome-objetivo').value;
        const meta = parseFloat(document.getElementById('valor-objetivo').value);
        objetivos.push({ nome, meta });
        localStorage.setItem('objetivos', JSON.stringify(objetivos));
        renderizarObjetivos();
        formularioObjetivo.reset();
    });

    listaObjetivosDiv.addEventListener('click', (e) => {
        if(e.target.classList.contains('btn-excluir')){
            const index = parseInt(e.target.dataset.index);
            objetivos.splice(index, 1);
            localStorage.setItem('objetivos', JSON.stringify(objetivos));
            renderizarObjetivos();
        }
    });

    filtroDescricao.addEventListener('input', filtrarLancamentos);
    filtroDataInicio.addEventListener('input', filtrarLancamentos);
    filtroDataFim.addEventListener('input', filtrarLancamentos);
    filtroCategoria.addEventListener('change', filtrarLancamentos);

    // Inicialização
    renderizarCategorias();
    renderizarDescricoes();
    renderizarTabela();
    sincronizarDados();
});

