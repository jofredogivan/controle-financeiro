document.addEventListener('DOMContentLoaded', () => {
    // Elementos
    const menuNavegacao = document.getElementById('menu-navegacao');
    const formularioLancamento = document.getElementById('formulario-lancamento');
    const tabelaCorpo = document.getElementById('tabela-corpo');
    const btnLimpar = document.getElementById('limpar-dados');

    const receitaSpan = document.getElementById('receita-total');
    const despesaSpan = document.getElementById('despesa-total');
    const saldoSpan = document.getElementById('saldo-final');

    const formularioObjetivo = document.getElementById('formulario-objetivo');
    const listaObjetivosDiv = document.getElementById('lista-objetivos');
    const filtroStatusObjetivo = document.getElementById('filtro-status-objetivo');
    const prioridadeObjetivoSelect = document.getElementById('prioridade-objetivo');

    const filtroDescricao = document.getElementById('filtro-descricao');
    const filtroDataInicio = document.getElementById('filtro-data-inicio');
    const filtroDataFim = document.getElementById('filtro-data-fim');
    const filtroCategoria = document.getElementById('filtro-categoria');

    const btnExportarExcel = document.getElementById('exportar-excel');
    const btnExportarPdf = document.getElementById('exportar-pdf');

    const ctxGraficoDespesas = document.getElementById('grafico-despesas');
    const ctxGraficoDicas = document.getElementById('grafico-dicas');
    const ctxGraficoReserva = document.getElementById('grafico-reserva');

    const btnReserva = document.getElementById('btn-reserva');
    const modalReserva = document.getElementById('reserva-modal');
    const spanFechar = modalReserva.querySelector('.fechar');
    const btnDefinirMetaModal = document.getElementById('btn-definir-meta-modal');
    const metaReservaModal = document.getElementById('meta-reserva-modal');
    const acumuladoReservaModal = document.getElementById('acumulado-reserva-modal');

    let graficoDespesas, graficoDicas, graficoReserva;

    let lancamentos = JSON.parse(localStorage.getItem('lancamentos')) || [];
    let metaReserva = parseFloat(localStorage.getItem('metaReserva')) || 0;
    let objetivos = JSON.parse(localStorage.getItem('objetivos')) || [];
    let categorias = JSON.parse(localStorage.getItem('categorias')) || ['Alimentação','Moradia','Transporte','Saúde','Lazer','Educação','Investimento','Reserva','Salário','Outros'];
    let descricoes = JSON.parse(localStorage.getItem('descricoes')) || ['Salário','Aluguel','Supermercado','Energia','Água','Internet','Transporte','Lazer','Cinema','Restaurante'];

    // ------------- Funções -------------
    function renderizarCategorias(){
        const listaCategoriasDatalist = document.getElementById('lista-categorias');
        listaCategoriasDatalist.innerHTML='';
        filtroCategoria.innerHTML='<option value="">Todas as Categorias</option>';
        categorias.forEach(c=>{
            const option=document.createElement('option');
            option.value=c;
            option.textContent=c;
            listaCategoriasDatalist.appendChild(option);

            const optionFiltro=document.createElement('option');
            optionFiltro.value=c;
            optionFiltro.textContent=c;
            filtroCategoria.appendChild(optionFiltro);
        });
    }

    function renderizarDescricoes(){
        const listaDescricoesDatalist = document.getElementById('lista-descricoes');
        listaDescricoesDatalist.innerHTML='';
        descricoes.forEach(d=>{
            const option=document.createElement('option');
            option.value=d;
            listaDescricoesDatalist.appendChild(option);
        });
    }

    function adicionarNovaCategoria(c){ if(c.trim() && !categorias.includes(c)){ categorias.push(c.trim()); localStorage.setItem('categorias', JSON.stringify(categorias)); renderizarCategorias(); }}
    function adicionarNovaDescricao(d){ if(d.trim() && !descricoes.includes(d)){ descricoes.push(d.trim()); localStorage.setItem('descricoes', JSON.stringify(descricoes)); renderizarDescricoes(); }}

    function calcularTotais(){
        let receitaTotal=0, despesaTotal=0;
        lancamentos.forEach(l=>{
            if(l.tipo==='receita') receitaTotal+=parseFloat(l.valor);
            else if(l.tipo==='despesa') despesaTotal+=parseFloat(l.valor);
        });
        const saldoFinal=receitaTotal-despesaTotal;
        receitaSpan.textContent=`R$ ${receitaTotal.toFixed(2)}`;
        despesaSpan.textContent=`R$ ${despesaTotal.toFixed(2)}`;
        saldoSpan.textContent=`R$ ${saldoFinal.toFixed(2)}`;
        saldoSpan.style.color=saldoFinal>=0?'#4CAF50':'#f44336';
    }

    function renderizarTabela(lancamentosParaExibir){
        tabelaCorpo.innerHTML='';
        (lancamentosParaExibir || lancamentos).forEach((l,i)=>{
            const tr=document.createElement('tr');
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
        let statusFiltro=filtroStatusObjetivo.value;
        objetivos.forEach((o,i)=>{
            let acumulado=lancamentos.filter(l=>l.categoria===o.nome && l.tipo==='despesa').reduce((s,l)=>s+parseFloat(l.valor),0);
            let progresso=(o.meta>0)?((acumulado/o.meta)*100).toFixed(2):0;
            if(statusFiltro==='pendente' && progresso>=100) return;
            if(statusFiltro==='concluido' && progresso<100) return;

            let corProgresso=o.prioridade==='Alta'?'#f44336':o.prioridade==='Média'?'#ff9800':'#4CAF50';
            listaObjetivosDiv.innerHTML+=`
                <div class="objetivo-item">
                    <h4>${o.nome} [${o.prioridade}]</h4>
                    <p>Meta: R$ ${o.meta.toFixed(2)}</p>
                    <p>Acumulado: R$ ${acumulado.toFixed(2)}</p>
                    <div class="progresso-bar">
                        <div class="progresso" style="width:${progresso}%;background:${corProgresso}">${progresso}%</div>
                    </div>
                    <button class="btn-adicionar" data-index="${i}">Adicionar Valor</button>
                    <button class="btn-excluir" data-index="${i}">Excluir</button>
                </div>
            `;
        });
    }

    function atualizarReserva(){
        let acumulado=lancamentos.filter(l=>l.categoria==='Reserva' && l.tipo==='despesa').reduce((s,l)=>s+parseFloat(l.valor),0);
        metaReservaModal.textContent=`R$ ${metaReserva.toFixed(2)}`;
        acumuladoReservaModal.textContent=`R$ ${acumulado.toFixed(2)}`;
        if(graficoReserva) graficoReserva.destroy();
        graficoReserva=new Chart(ctxGraficoReserva,{type:'doughnut',data:{labels:['Acumulado','Faltante'],datasets:[{data:[acumulado,Math.max(metaReserva-acumulado,0)],backgroundColor:['#4CAF50','#f44336']}]},options:{responsive:true}});
    }

    function sincronizarDados(){
        calcularTotais();
        renderizarTabela();
        renderizarObjetivos();
        atualizarReserva();
    }

    // ------------- Eventos -------------
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

    spanFechar.onclick=()=>modalReserva.style.display='none';
    window.onclick=e=>{if(e.target===modalReserva) modalReserva.style.display='none';};

    formularioLancamento.addEventListener('submit',e=>{
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

    tabelaCorpo.addEventListener('click',e=>{
        const index=parseInt(e.target.dataset.index);
        if(e.target.classList.contains('btn-excluir')){
            lancamentos.splice(index,1);
            localStorage.setItem('lancamentos',JSON.stringify(lancamentos));
            sincronizarDados();
        }
    });

    btnLimpar.addEventListener('click',()=>{
        if(confirm('Deseja realmente limpar todos os dados?')){
            lancamentos=[];objetivos=[];metaReserva=0;
            localStorage.clear();
            sincronizarDados();
        }
    });

    formularioObjetivo.addEventListener('submit',e=>{
        e.preventDefault();
        const nome=document.getElementById('nome-objetivo').value;
        const meta=parseFloat(document.getElementById('valor-objetivo').value);
        const prioridade=document.getElementById('prioridade-objetivo').value;
        objetivos.push({nome,meta,prioridade});
        localStorage.setItem('objetivos',JSON.stringify(objetivos));
        formularioObjetivo.reset();
        renderizarObjetivos();
    });

    listaObjetivosDiv.addEventListener('click',e=>{
        const index=parseInt(e.target.dataset.index);
        if(e.target.classList.contains('btn-excluir')){
            objetivos.splice(index,1);
            localStorage.setItem('objetivos',JSON.stringify(objetivos));
            renderizarObjetivos();
        }else if(e.target.classList.contains('btn-adicionar')){
            const valorAdicionado=prompt('Informe o valor a adicionar ao objetivo:');
            const valor=parseFloat(valorAdicionado);
            if(!isNaN(valor) && valor>0){
                lancamentos.push({data:new Date().toISOString().split('T')[0],descricao=objetivos[index].nome,categoria=objetivos[index].nome,valor,tipo:'despesa'});
                localStorage.setItem('lancamentos',JSON.stringify(lancamentos));
                sincronizarDados();
            }
        }
    });

    filtroStatusObjetivo.addEventListener('change', renderizarObjetivos);

    filtroDescricao.addEventListener('input',()=>filtrarLancamentos());
    filtroDataInicio.addEventListener('change',()=>filtrarLancamentos());
    filtroDataFim.addEventListener('change',()=>filtrarLancamentos());
    filtroCategoria.addEventListener('change',()=>filtrarLancamentos());

    // ---------- Inicialização ----------
    renderizarCategorias();
    renderizarDescricoes();
    sincronizarDados();
});
