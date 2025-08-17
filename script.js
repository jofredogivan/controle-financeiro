document.addEventListener('DOMContentLoaded', () => {
    // Seletores dos elementos da interface
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
    
    // Elementos do gráfico
    const ctxGraficoDespesas = document.getElementById('grafico-despesas');
    let graficoDespesas;

    // Elementos do filtro
    const filtroDescricao = document.getElementById('filtro-descricao');
    const filtroDataInicio = document.getElementById('filtro-data-inicio');
    const filtroDataFim = document.getElementById('filtro-data-fim');
    const filtroCategoria = document.getElementById('filtro-categoria');

    // Elementos de exportação
    const btnExportarExcel = document.getElementById('exportar-excel');
    const btnExportarPdf = document.getElementById('exportar-pdf');

    // Estado da aplicação (dados salvos no navegador)
    let lancamentos = JSON.parse(localStorage.getItem('lancamentos')) || [];
    let metaReserva = parseFloat(localStorage.getItem('metaReserva')) || 0;
    let objetivos = JSON.parse(localStorage.getItem('objetivos')) || [];
    let categorias = JSON.parse(localStorage.getItem('categorias')) || ['Alimentação', 'Moradia', 'Transporte', 'Saúde', 'Lazer', 'Educação', 'Investimento', 'Reserva', 'Salário', 'Outros'];
    let descricoes = JSON.parse(localStorage.getItem('descricoes')) || ['Salário', 'Aluguel', 'Supermercado', 'Energia', 'Água', 'Internet', 'Transporte', 'Lazer', 'Cinema', 'Restaurante'];

    // --- Funções de Renderização e Atualização ---

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
            if (lancamento.tipo === 'receita') {
                receitaTotal += parseFloat(lancamento.valor);
            } else if (lancamento.tipo === 'despesa') {
                despesaTotal += parseFloat(lancamento.valor);
            }
        });

        const saldoFinal = receitaTotal - despesaTotal;

        receitaSpan.textContent = `R$ ${receitaTotal.toFixed(2)}`;
        despesaSpan.textContent = `R$ ${despesaTotal.toFixed(2)}`;
        saldoSpan.textContent = `R$ ${saldoFinal.toFixed(2)}`;

        if (saldoFinal >= 0) {
            saldoSpan.style.color = '#4CAF50';
        } else {
            saldoSpan.style.color = '#f44336';
        }
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
        
        if (progresso >= 100) {
            progressoReservaSpan.style.color = '#4CAF50';
        } else {
            progressoReservaSpan.style.color = '#333';
        }
    }

    function renderizarObjetivos() {
        listaObjetivosDiv.innerHTML = '';
        objetivos.forEach((objetivo, index) => {
            let valorAcumulado = 0;
            lancamentos.forEach(lancamento => {
                if (lancamento.categoria.toLowerCase() === objetivo.nome.toLowerCase()) {
                    valorAcumulado += parseFloat(lancamento.valor);
                }
            });

            const progresso = (objetivo.meta > 0) ? ((valorAcumulado / objetivo.meta) * 100).toFixed(2) : 0;

            const objetivoHTML = `
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
            listaObjetivosDiv.innerHTML += objetivoHTML;
        });
    }

    function renderizarGraficoDespesas() {
        const despesasPorCategoria = {};
        lancamentos.forEach(lancamento => {
            if (lancamento.tipo === 'despesa') {
                const categoria = lancamento.categoria.toLowerCase();
                if (despesasPorCategoria[categoria]) {
                    despesasPorCategoria[categoria] += parseFloat(lancamento.valor);
                } else {
                    despesasPorCategoria[categoria] = parseFloat(lancamento.valor);
                }
            }
        });

        const labels = Object.keys(despesasPorCategoria);
        const data = Object.values(despesasPorCategoria);
        
        const backgroundColors = [
            '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#E7E9ED', '#8B5F65'
        ];

        const chartData = {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: backgroundColors,
            }]
        };

        if (graficoDespesas) {
            graficoDespesas.destroy();
        }

        graficoDespesas = new Chart(ctxGraficoDespesas, {
            type: 'doughnut',
            data: chartData,
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    tooltip: {
                        callbacks: {
                            label: function(tooltipItem) {
                                const value = tooltipItem.raw;
                                return `${tooltipItem.label}: R$ ${value.toFixed(2)}`;
                            }
                        }
                    }
                }
            }
        });
    }
    
    // --- Lógica de Sincronização e Atualização ---
    function sincronizarDados() {
        atualizarTotais();
        renderizarGraficoDespesas();
        atualizarReserva();
        renderizarObjetivos();
    }

    function filtrarLancamentos() {
        const descricaoBusca = filtroDescricao.value.toLowerCase();
        const dataInicio = filtroDataInicio.value;
        const dataFim = filtroDataFim.value;
        const categoriaFiltro = filtroCategoria.value.toLowerCase();

        const lancamentosFiltrados = lancamentos.filter(lancamento => {
            const dataLancamento = lancamento.data;
            const descricaoLancamento = lancamento.descricao.toLowerCase();
            const categoriaLancamento = lancamento.categoria.toLowerCase();

            const matchDescricao = descricaoLancamento.includes(descricaoBusca);
            const matchCategoria = categoriaFiltro === '' || categoriaLancamento === categoriaFiltro;
            
            const matchDataInicio = !dataInicio || dataLancamento >= dataInicio;
            const matchDataFim = !dataFim || dataLancamento <= dataFim;

            return matchDescricao && matchCategoria && matchDataInicio && matchDataFim;
        });
        
        renderizarTabela(lancamentosFiltrados);
    }
    
    // --- Funções de Exportação ---

    function exportarParaExcel() {
        const tabela = document.querySelector('table');
        const html = tabela.outerHTML;
        const nomeArquivo = `lancamentos-${new Date().toISOString().split('T')[0]}.xls`;

        const uri = 'data:application/vnd.ms-excel;base64,';
        const template = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head></head><body><table>{table}</table></body></html>';
        
        const base64 = s => window.btoa(unescape(encodeURIComponent(s)));
        const format = (s, c) => s.replace(/{(\w+)}/g, (m, p) => c[p]);

        const ctx = {
            worksheet: 'Histórico de Lançamentos',
            table: html
        };

        const link = document.createElement('a');
        link.href = uri + base64(format(template, ctx));
        link.download = nomeArquivo;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    function exportarParaPDF() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        doc.text("Histórico de Lançamentos", 10, 10);
        
        const tabela = document.querySelector('table');
        doc.html(tabela, {
            callback: function (doc) {
                doc.save('historico-lancamentos.pdf');
            },
            x: 10,
            y: 20,
            html2canvas: { scale: 0.25 }
        });
    }

    // --- Funções de Eventos e Lógica ---

    function definirMeta() {
        const novaMeta = prompt("Digite o valor da sua meta de reserva de emergência:");
        if (novaMeta && !isNaN(novaMeta) && parseFloat(novaMeta) >= 0) {
            metaReserva = parseFloat(novaMeta);
            localStorage.setItem('metaReserva', metaReserva);
            sincronizarDados(); // Sincroniza os dados após definir a meta
        } else {
            alert("Valor inválido. Por favor, digite um número válido.");
        }
    }

    function excluirLancamento(index) {
        lancamentos.splice(index, 1);
        localStorage.setItem('lancamentos', JSON.stringify(lancamentos));
        renderizarTabela();
        sincronizarDados(); // Sincroniza os dados após excluir um lançamento
    }

    function limparTodosOsDados() {
        if (confirm("Tem certeza que deseja limpar todos os dados?")) {
            lancamentos = [];
            metaReserva = 0;
            objetivos = [];
            localStorage.clear();
            renderizarTabela();
            renderizarCategorias();
            renderizarDescricoes();
            sincronizarDados(); // Sincroniza os dados após a limpeza total
        }
    }
    
    // --- Lógica de Navegação ---

    function irParaTela(idTela) {
        const telas = document.querySelectorAll('section');
        telas.forEach(tela => {
            tela.classList.remove('tela-ativa');
        });
        document.getElementById(idTela).classList.add('tela-ativa');

        const botoes = document.querySelectorAll('#menu-navegacao button');
        botoes.forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`#menu-navegacao button[data-target="${idTela}"]`).classList.add('active');

        sincronizarDados();
        if (idTela === 'historico') {
            renderizarTabela();
        }
    }

    // --- Listeners de Eventos ---

    formularioLancamento.addEventListener('submit', (e) => {
        e.preventDefault();

        const novaCategoria = document.getElementById('categoria').value;
        const novaDescricao = document.getElementById('descricao').value;
        adicionarNovaCategoria(novaCategoria);
        adicionarNovaDescricao(novaDescricao);

        const novoLancamento = {
            data: document.getElementById('data').value,
            descricao: novaDescricao,
            categoria: novaCategoria,
            valor: parseFloat(document.getElementById('valor').value).toFixed(2),
            tipo: document.getElementById('tipo').value,
        };

        lancamentos.push(novoLancamento);
        localStorage.setItem('lancamentos', JSON.stringify(lancamentos));

        formularioLancamento.reset();
        renderizarTabela();
        sincronizarDados();
    });

    formularioObjetivo.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const nomeObjetivo = document.getElementById('nome-objetivo').value;
        const valorObjetivo = parseFloat(document.getElementById('valor-objetivo').value);
        adicionarNovaCategoria(nomeObjetivo);

        if (nomeObjetivo && !isNaN(valorObjetivo) && valorObjetivo > 0) {
            objetivos.push({ nome: nomeObjetivo, meta: valorObjetivo });
            localStorage.setItem('objetivos', JSON.stringify(objetivos));
            formularioObjetivo.reset();
            renderizarObjetivos();
            sincronizarDados();
        } else {
            alert("Por favor, preencha todos os campos do objetivo corretamente.");
        }
    });

    tabelaCorpo.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-excluir')) {
            const index = e.target.getAttribute('data-index');
            excluirLancamento(index);
        }
    });
    
    listaObjetivosDiv.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-excluir')) {
            const index = e.target.getAttribute('data-index');
            objetivos.splice(index, 1);
            localStorage.setItem('objetivos', JSON.stringify(objetivos));
            renderizarObjetivos();
            sincronizarDados();
        }
    });

    // Evento de navegação aprimorado
    menuNavegacao.addEventListener('click', (e) => {
        const button = e.target.closest('button');
        if (button) {
            const idTela = button.getAttribute('data-target');
            irParaTela(idTela);
        }
    });

    btnLimpar.addEventListener('click', limparTodosOsDados);
    btnDefinirMeta.addEventListener('click', definirMeta);

    // Listeners para os filtros
    filtroDescricao.addEventListener('input', filtrarLancamentos);
    filtroDataInicio.addEventListener('input', filtrarLancamentos);
    filtroDataFim.addEventListener('input', filtrarLancamentos);
    filtroCategoria.addEventListener('change', filtrarLancamentos);
    
    // Listeners para os botões de exportação
    btnExportarExcel.addEventListener('click', exportarParaExcel);
    btnExportarPdf.addEventListener('click', exportarParaPDF);

    // --- Inicialização ---

    renderizarCategorias();
    renderizarDescricoes();
    sincronizarDados();
    irParaTela('lancamento');
});
