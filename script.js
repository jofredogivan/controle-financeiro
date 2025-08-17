document.addEventListener('DOMContentLoaded', () => {
    // Seletores
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

    let lancamentos = JSON.parse(localStorage.getItem('lancamentos')) || [];
    let metaReserva = parseFloat(localStorage.getItem('metaReserva')) || 0;
    let objetivos = JSON.parse(localStorage.getItem('objetivos')) || [];
    let categorias = JSON.parse(localStorage.getItem('categorias')) || ['Alimentação','Moradia','Transporte','Saúde','Lazer','Educação','Investimento','Reserva','Salário','Outros'];
    let descricoes = JSON.parse(localStorage.getItem('descricoes')) || ['Salário','Aluguel','Supermercado','Energia','Água','Internet','Transporte','Lazer','Cinema','Restaurante'];

    // --- Funções ---
    function renderizarCategorias() {
        listaCategoriasDatalist.innerHTML = '';
        filtroCategoria.innerHTML = '<option value="">Todas as Categorias</option>';
        categorias.forEach(categoria => {
            const option = document.createElement('option');
            option.value = categoria; option.textContent = categoria;
            listaCategoriasDatalist.appendChild(option);
            const optionFiltro = document.createElement('option');
            optionFiltro.value = categoria; optionFiltro.textContent = categoria;
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
        const lista = lancamentosParaExibir || lancamentos;
        lista.forEach((lancamento,index)=>{
            const linha = document.createElement('tr');
            linha.innerHTML = `
                <td data-label="Data">${lancamento.data}</td>
                <td data-label="Descrição">${lancamento.descricao}</td>
                <td data-label="Categoria">${lancamento.categoria}</td>
                <td data-label="Valor">${lancamento.valor}</td>
                <td data-label="Tipo">${lancamento.tipo}</td>
                <td><button class="btn-excluir" data-index="${index}">Excluir</button></td>
            `;
            tabelaCorpo.appendChild(linha);
        });
    }
    function atualizarTotais() {
        let receitaTotal=0, despesaTotal=0;
        lancamentos.forEach(lancamento=>{
            if(lancamento.tipo==='receita') receitaTotal+=parseFloat(lancamento.valor);
            else if(lancamento.tipo==='despesa') despesaTotal+=parseFloat(lancamento.valor);
        });
        const saldoFinal=receitaTotal-despesaTotal;
        receitaSpan.textContent=`R$ ${receitaTotal.toFixed(2)}`;
        despesaSpan.textContent=`R$ ${despesaTotal.toFixed(2)}`;
        saldoSpan.textContent=`R$ ${saldoFinal.toFixed(2)}`;
        saldoSpan.style.color=saldoFinal>=0?'#4CAF50':'#f44336';
    }
    function atualizarReserva() {
        let acumulado=0;
        lancamentos.forEach(lancamento=>{
            if(lancamento.categoria.toLowerCase()==='reserva') acumulado+=parseFloat(lancamento.valor);
        });
        const progresso=(metaReserva>0)?((acumulado/metaReserva)*100).toFixed(2):0;
        metaReservaSpan.textContent=`R$ ${metaReserva.toFixed(2)}`;
        acumuladoReservaSpan.textContent=`R$ ${acumulado.toFixed(2)}`;
        progressoReservaSpan.textContent=`${progresso}%`;
        progressoReservaSpan.style.color=progresso>=100?'#4CAF50':'#333';
    }
    function renderizarObjetivos() {
        listaObjetivosDiv.innerHTML='';
        objetivos.forEach((objetivo,index)=>{
            let acumulado=0;
            lancamentos.forEach(lancamento=>{
                if(lancamento.categoria.toLowerCase()===objetivo.nome.toLowerCase()) acumulado+=parseFloat(lancamento.valor);
            });
            const progresso=(objetivo.meta>0)?((acumulado/objetivo.meta)*100).toFixed(2):0;
            listaObjetivosDiv.innerHTML+=`
                <div class="objetivo-item">
                    <h4>${objetivo.nome}</h4>
                    <p>Meta: R$ ${objetivo.meta.toFixed(2)}</p>
                    <p>Acumulado: R$ ${acumulado.toFixed(2)}</p>
                    <div class="progresso-bar"><div class="progresso" style="width:${progresso}%">${progresso}%</div></div>
                    <button class="btn-excluir" data-index="${index}">Excluir</button>
                </div>
            `;
        });
    }
    function renderizarGraficoDespesas() {
        const despesasPorCategoria={};
        lancamentos.forEach(lancamento=>{
            if(lancamento.tipo==='despesa'){
                const cat=lancamento.categoria.toLowerCase();
                despesasPorCategoria[cat]=despesasPorCategoria[cat]?despesasPorCategoria[cat]+parseFloat(lancamento.valor):parseFloat(lancamento.valor);
            }
        });
        const labels=Object.keys(despesasPorCategoria);
        const data=Object.values(despesasPorCategoria);
        const cores=['#FF6384','#36A2EB','#FFCE56','#4BC0C0','#9966FF','#FF9F40','#E7E9ED','#8B5F65'];
        const chartData={labels:labels,datasets:[{data:data,backgroundColor:cores}]};
        if(graficoDespesas) graficoDespesas.destroy();
        graficoDespesas=new Chart(ctxGraficoDespesas,{type:'doughnut',data:chartData,options:{responsive:true,plugins:{legend:{position:'top'},tooltip:{callbacks:{label:function(t){return `${t.label}: R$ ${t.raw.toFixed(2)}`;}}}}}});
    }
    function sincronizarDados(){atualizarTotais();renderizarGraficoDespesas();atualizarReserva();renderizarObjetivos();}
    function filtrarLancamentos(){
        const desc=filtroDescricao.value.toLowerCase(), dtInicio=filtroDataInicio.value, dtFim=filtroDataFim.value, cat=filtroCategoria.value.toLowerCase();
        renderizarTabela(lancamentos.filter(l=>{
            const lDesc=l.descricao.toLowerCase(), lCat=l.categoria.toLowerCase();
            const mDesc=lDesc.includes(desc), mCat=!cat||lCat===cat, mInicio=!dtInicio||l.data>=dtInicio, mFim=!dtFim||l.data<=dtFim;
            return mDesc&&mCat&&mInicio&&mFim;
        }));
    }
    function exportarParaExcel(){
        const html=document.querySelector('table').outerHTML;
        const nomeArquivo=`lancamentos-${new Date().toISOString().split('T')[0]}.xls`;
        const uri='data:application/vnd.ms-excel;base64,';
        const template='<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head></head><body><table>{table}</table></body></html>';
        const base64=s=>window.btoa(unescape(encodeURIComponent(s)));
        const format=(s,c)=>s.replace(/{(\w+)}/g,(m,p)=>c[p]);
        const ctx={worksheet:'Histórico de Lançamentos',table:html};
        const link=document.createElement('a'); link.href=uri+base64(format(template,ctx)); link.download=nomeArquivo;
        document.body.appendChild(link); link.click(); document.body.removeChild(link);
    }
    function exportarParaPDF(){
        const { jsPDF }=window.jspdf; const doc=new jsPDF();
        doc.text("Histórico de Lançamentos",10,10);
        doc.html(document.querySelector('table'),{callback:function(d){d.save('historico-lancamentos.pdf');},x:10,y:20,html2canvas:{scale:0.25}});
    }
    function definirMeta(){
        const novaMeta=prompt("Digite o valor da sua meta de reserva de emergência:");
        if(novaMeta&&!isNaN(novaMeta)&&parseFloat(novaMeta)>=0){metaReserva=parseFloat(novaMeta);localStorage.setItem('metaReserva',metaReserva);sincronizarDados();} 
        else alert("Valor inválido. Por favor, digite um número válido.");
    }
    function excluirLancamento(index){lancamentos.splice(index,1);localStorage.setItem('lancamentos',JSON.stringify(lancamentos));renderizarTabela();sincronizarDados();}
    function limparTodosOsDados(){if(confirm("Tem certeza que deseja limpar todos os dados?")){lancamentos=[];metaReserva=0;objetivos=[];localStorage.clear();renderizarTabela();renderizarCategorias();renderizarDescricoes();sincronizarDados();}}
    function irParaTela(idTela){
        document.querySelectorAll('.tela').forEach(t=>t.classList.remove('ativa'));
        document.getElementById(idTela).classList.add('ativa');
        document.querySelectorAll('#menu-navegacao button').forEach(b=>b.classList.remove('active'));
        document.querySelector(`#menu-navegacao button[data-tela="${idTela}"]`).classList.add('active');
        sincronizarDados();
        if(idTela==='historico') renderizarTabela();
    }

    // --- Eventos ---
    formularioLancamento.addEventListener('submit', e=>{
        e.preventDefault();
        const novaCategoria=document.getElementById('categoria').value;
        const novaDescricao=document.getElementById('descricao').value;
        adicionarNovaCategoria(novaCategoria); adicionarNovaDescricao(novaDescricao);
        lancamentos.push({
            data:document.getElementById('data').value,
            descricao:novaDescricao,
            categoria:novaCategoria,
            valor:parseFloat(document.getElementById('valor').value).toFixed(2),
            tipo:document.getElementById('tipo').value
        });
        localStorage.setItem('lancamentos',JSON.stringify(lancamentos));
        formularioLancamento.reset();
        renderizarTabela(); sincronizarDados();
    });
    formularioObjetivo.addEventListener('submit', e=>{
        e.preventDefault();
        const nome=document.getElementById('nome-objetivo').value;
        const valor=parseFloat(document.getElementById('valor-objetivo').value);
        adicionarNovaCategoria(nome);
        if(nome&&!isNaN(valor)&&valor>0){objetivos.push({nome:nome,meta:valor});localStorage.setItem('objetivos',JSON.stringify(objetivos));formularioObjetivo.reset();renderizarObjetivos();sincronizarDados();}
        else alert("Por favor, preencha todos os campos do objetivo corretamente.");
    });
    tabelaCorpo.addEventListener('click', e=>{if(e.target.classList.contains('btn-excluir')) excluirLancamento(e.target.getAttribute('data-index'));});
    listaObjetivosDiv.addEventListener('click', e=>{if(e.target.classList.contains('btn-excluir')){objetivos.splice(e.target.getAttribute('data-index'),1);localStorage.setItem('objetivos',JSON.stringify(objetivos));renderizarObjetivos();sincronizarDados();}});
    menuNavegacao.addEventListener('click', e=>{const btn=e.target.closest('button'); if(btn) irParaTela(btn.getAttribute('data-tela'));});
    btnLimpar.addEventListener('click', limparTodosOsDados);
    btnDefinirMeta.addEventListener('click', definirMeta);
    filtroDescricao.addEventListener('input', filtrarLancamentos);
    filtroDataInicio.addEventListener('input', filtrarLancamentos);
    filtroDataFim.addEventListener('input', filtrarLancamentos);
    filtroCategoria.addEventListener('change', filtrarLancamentos);
    btnExportarExcel.addEventListener('click', exportarParaExcel);
    btnExportarPdf.addEventListener('click', exportarParaPDF);

    // --- Inicialização ---
    renderizarCategorias();
    renderizarDescricoes();
    sincronizarDados();
    irParaTela('lancamento');
});
