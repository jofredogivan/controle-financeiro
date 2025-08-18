document.addEventListener('DOMContentLoaded',()=>{
    const formularioLancamento=document.getElementById('formulario-lancamento');
    const tabelaCorpo=document.getElementById('tabela-corpo');
    const btnLimpar=document.getElementById('limpar-dados');
    const btnDefinirMeta=document.getElementById('definir-meta');
    const formularioObjetivo=document.getElementById('formulario-objetivo');
    const listaObjetivosDiv=document.getElementById('lista-objetivos');
    const listaCategoriasDatalist=document.getElementById('lista-categorias');
    const listaDescricoesDatalist=document.getElementById('lista-descricoes');
    const menuNavegacao=document.getElementById('menu-navegacao');
    const filtroStatusObjetivo=document.getElementById('filtro-status-objetivo');
    const abrirReserva=document.getElementById('abrir-reserva');
    const reservaModal=document.getElementById('reserva-modal');
    const fecharReserva=reservaModal.querySelector('.fechar');

    const receitaSpan=document.getElementById('receita-total');
    const despesaSpan=document.getElementById('despesa-total');
    const saldoSpan=document.getElementById('saldo-final');
    const metaReservaSpan=document.getElementById('meta-reserva');
    const acumuladoReservaSpan=document.getElementById('acumulado-reserva');
    const progressoReservaSpan=document.getElementById('progresso-reserva');

    const filtroDescricao=document.getElementById('filtro-descricao');
    const filtroDataInicio=document.getElementById('filtro-data-inicio');
    const filtroDataFim=document.getElementById('filtro-data-fim');
    const filtroCategoria=document.getElementById('filtro-categoria');

    const ctxGraficoDespesas=document.getElementById('grafico-despesas');
    let graficoDespesas;
    const ctxGraficoDicas=document.getElementById('grafico-dicas');
    let graficoDicas;

    let lancamentos=JSON.parse(localStorage.getItem('lancamentos'))||[];
    let metaReserva=parseFloat(localStorage.getItem('metaReserva'))||0;
    let objetivos=JSON.parse(localStorage.getItem('objetivos'))||[];
    let categorias=JSON.parse(localStorage.getItem('categorias'))||['Alimentação','Moradia','Transporte','Saúde','Lazer','Educação','Investimento','Reserva','Salário','Outros'];
    let descricoes=JSON.parse(localStorage.getItem('descricoes'))||['Salário','Aluguel','Supermercado','Energia','Água','Internet','Transporte','Lazer','Cinema','Restaurante'];

    // Funções utilitárias
    function renderizarCategorias(){
        listaCategoriasDatalist.innerHTML='';
        filtroCategoria.innerHTML='<option value="">Todas as Categorias</option>';
        categorias.forEach(cat=>{
            const option=document.createElement('option');
            option.value=cat; option.textContent=cat; listaCategoriasDatalist.appendChild(option);
            const optionFiltro=document.createElement('option');
            optionFiltro.value=cat; optionFiltro.textContent=cat; filtroCategoria.appendChild(optionFiltro);
        });
    }

    function renderizarDescricoes(){
        listaDescricoesDatalist.innerHTML='';
        descricoes.forEach(d=>{
            const option=document.createElement('option'); option.value=d;
            listaDescricoesDatalist.appendChild(option);
        });
    }

    function adicionarNovaCategoria(cat){
        if(!categorias.includes(cat) && cat.trim()!==''){
            categorias.push(cat.trim()); localStorage.setItem('categorias',JSON.stringify(categorias)); renderizarCategorias();
        }
    }

    function adicionarNovaDescricao(desc){
        if(!descricoes.includes(desc) && desc.trim()!==''){
            descricoes.push(desc.trim()); localStorage.setItem('descricoes',JSON.stringify(descricoes)); renderizarDescricoes();
        }
    }

    function atualizarTotais(){
        let receitaTotal=0; let despesaTotal=0;
        lancamentos.forEach(l=>{
            if(l.tipo==='receita') receitaTotal+=parseFloat(l.valor);
            else despesaTotal+=parseFloat(l.valor);
        });
        const saldo=receitaTotal-despesaTotal;
        receitaSpan.textContent=`R$ ${receitaTotal.toFixed(2)}`;
        despesaSpan.textContent=`R$ ${despesaTotal.toFixed(2)}`;
        saldoSpan.textContent=`R$ ${saldo.toFixed(2)}`;
        saldoSpan.style.color=saldo>=0?'#4CAF50':'#f44336';
    }

    function atualizarReserva(){
        let valorAcumulado=0;
        lancamentos.forEach(l=>{if(l.categoria.toLowerCase()==='reserva') valorAcumulado+=parseFloat(l.valor);});
        const progresso=metaReserva>0?((valorAcumulado/metaReserva)*100).toFixed(2):0;
        metaReservaSpan.textContent=`R$ ${metaReserva.toFixed(2)}`;
        acumuladoReservaSpan.textContent=`R$ ${valorAcumulado.toFixed(2)}`;
        progressoReservaSpan.textContent=`${progresso}%`;
        progressoReservaSpan.style.color=progresso>=100?'#4CAF50':'#ff9800';
    }

    function renderizarObjetivos(){
        listaObjetivosDiv.innerHTML='';
        const statusFiltro=filtroStatusObjetivo.value;
        objetivos.forEach((obj,index)=>{
            const valorAcumulado=lancamentos.filter(l=>l.categoria.toLowerCase()===obj.nome.toLowerCase())
                .reduce((sum,l)=>sum+parseFloat(l.valor),0);
            const progresso=obj.meta>0?((valorAcumulado/obj.meta)*100).toFixed(2):0;
            const concluido=progresso>=100?'concluido':'pendente';
            if(statusFiltro==='todos'||statusFiltro===concluido){
                const div=document.createElement('div');
                div.classList.add('objetivo-item',concluido,obj.prioridade||'media');
                div.innerHTML=`
                    <h4>${obj.nome} (${obj.prioridade||'Média'})</h4>
                    <p>Meta: R$ ${obj.meta.toFixed(2)}</p>
                    <p>Acumulado: R$ ${valorAcumulado.toFixed(2)}</p>
                    <div class="progresso-bar">
                        <div class="progresso" style="width:${progresso}%;background-color:${concluido==='concluido'?'#4caf50':'#ff9800'}">${progresso}%</div>
                    </div>
                    <button class="btn-excluir" data-index="${index}">Excluir</button>
                `;
                listaObjetivosDiv.appendChild(div);
            }
        });
    }

    function renderizarTabela(lancamentosParaExibir){
        tabelaCorpo.innerHTML='';
        const arr=lancamentosParaExibir||lancamentos;
        arr.forEach((l,index)=>{
            if(window.innerWidth<=768){
                const card=document.createElement('div'); card.classList.add('historico-card');
                card.innerHTML=`
                    <div>Data: <span>${l.data}</span></div>
                    <div>Descrição: <span>${l.descricao}</span></div>
                    <div>Categoria: <span>${l.categoria}</span></div>
                    <div>Valor: <span>R$ ${parseFloat(l.valor).toFixed(2)}</span></div>
                    <div>Tipo: <span>${l.tipo}</span></div>
                    <div class="acoes"><button class="btn-excluir" data-index="${index}">Excluir</button></div>
                `;
                tabelaCorpo.appendChild(card);
            }else{
                const tr=document.createElement('tr');
                tr.innerHTML=`
                    <td>${l.data}</td>
                    <td>${l.descricao}</td>
                    <td>${l.categoria}</td>
                    <td>${l.valor}</td>
                    <td>${l.tipo}</td>
                    <td><button class="btn-excluir" data-index="${index}">Excluir</button></td>
                `;
                tabelaCorpo.appendChild(tr);
            }
        });
    }

    function renderizarGraficoDespesas(){
        const despesas={};
        lancamentos.forEach(l=>{if(l.tipo==='despesa'){const cat=l.categoria.toLowerCase(); despesas[cat]=(despesas[cat]||0)+parseFloat(l.valor);}});
        const labels=Object.keys(despesas); const data=Object.values(despesas);
        const colors=['#FF6384','#36A2EB','#FFCE56','#4BC0C0','#9966FF','#FF9F40','#E7E9ED','#8B5F65'];
        if(graficoDespesas) graficoDespesas.destroy();
        graficoDespesas=new Chart(ctxGraficoDespesas,{type:'doughnut',data:{labels,datasets:[{data,backgroundColor:colors}]},options:{responsive:true}});
    }

    function renderizarGraficoDicas(){
        const dados=[50,30,20]; const labels=['Essenciais','Lazer','Poupança']; const colors=['#4caf50','#ff9800','#2196f3'];
        if(graficoDicas) graficoDicas.destroy();
        graficoDicas=new Chart(ctxGraficoDicas,{type:'doughnut',data:{labels,datasets:[{data:dados,backgroundColor:colors}]},options:{responsive:true}});
    }

    function sincronizarDados(){
        atualizarTotais(); renderizarGraficoDespesas(); atualizarReserva(); renderizarObjetivos(); renderizarGraficoDicas();
    }

    function filtrarLancamentos(){
        const desc=filtroDescricao.value.toLowerCase(); const dataInicio=filtroDataInicio.value; const dataFim=filtroDataFim.value; const cat=filtroCategoria.value.toLowerCase();
        const filtrados=lancamentos.filter(l=>{
            const dOk=l.descricao.toLowerCase().includes(desc);
            const dataOk=(!dataInicio||l.data>=dataInicio)&&(!dataFim||l.data<=dataFim);
            const catOk=!cat||l.categoria.toLowerCase()===cat;
            return dOk&&dataOk&&catOk;
        });
        renderizarTabela(filtrados);
    }

    // Navegação
    menuNavegacao.querySelectorAll('button[data-target]').forEach(btn=>{
        btn.addEventListener('click',()=>{
            document.querySelectorAll('section').forEach(sec=>sec.classList.remove('tela-ativa'));
            document.getElementById(btn.dataset.target).classList.add('tela-ativa');
            menuNavegacao.querySelectorAll('button').forEach(b=>b.classList.remove('active'));
            btn.classList.add('active');
        });
    });

    abrirReserva.addEventListener('click',()=>reservaModal.style.display='flex');
    fecharReserva.addEventListener('click',()=>reservaModal.style.display='none');
    window.addEventListener('click',e=>{if(e.target===reservaModal)reservaModal.style.display='none';});

    formularioLancamento.addEventListener('submit',e=>{
        e.preventDefault();
        const data=document.getElementById('data').value;
        const descricao=document.getElementById('descricao').value;
        const categoria=document.getElementById('categoria').value;
        const valor=parseFloat(document.getElementById('valor').value);
        const tipo=document.getElementById('tipo').value;
        adicionarNovaCategoria(categoria); adicionarNovaDescricao(descricao);

        // reserva como despesa
        if(categoria.toLowerCase()==='reserva' && tipo==='despesa'){
            lancamentos.push({data,descricao,categoria,valor,tipo});
        } else {
            lancamentos.push({data,descricao,categoria,valor,tipo});
        }

        localStorage.setItem('lancamentos',JSON.stringify(lancamentos));
        renderizarTabela(); sincronizarDados();
        formularioLancamento.reset();
    });

    tabelaCorpo.addEventListener('click',e=>{
        if(e.target.classList.contains('btn-excluir')){
            const index=parseInt(e.target.dataset.index);
            lancamentos.splice(index,1); localStorage.setItem('lancamentos',JSON.stringify(lancamentos));
            renderizarTabela(); sincronizarDados();
        }
    });

    btnLimpar.addEventListener('click',()=>{
        if(confirm('Deseja realmente limpar todos os dados?')){
            lancamentos=[]; objetivos=[]; metaReserva=0; localStorage.clear();
            renderizarTabela(); sincronizarDados();
        }
    });

    btnDefinirMeta.addEventListener('click',()=>{
        const novaMeta=parseFloat(prompt('Defina o valor da sua reserva de emergência:'));
        if(!isNaN(novaMeta)){metaReserva=novaMeta; localStorage.setItem('metaReserva',metaReserva); sincronizarDados();}
    });

    formularioObjetivo.addEventListener('submit',e=>{
        e.preventDefault();
        const nome=document.getElementById('nome-objetivo').value;
        const meta=parseFloat(document.getElementById('valor-objetivo').value);
        const prioridade=document.getElementById('prioridade-objetivo').value;
        objetivos.push({nome,meta,prioridade}); localStorage.setItem('objetivos',JSON.stringify(objetivos));
        renderizarObjetivos(); formularioObjetivo.reset();
    });

    listaObjetivosDiv.addEventListener('click',e=>{
        if(e.target.classList.contains('btn-excluir')){
            const index=parseInt(e.target.dataset.index);
            objetivos.splice(index,1); localStorage.setItem('objetivos',JSON.stringify(objetivos));
            renderizarObjetivos();
        }
    });

    filtroStatusObjetivo.addEventListener('change',renderizarObjetivos);
    filtroDescricao.addEventListener('input',filtrarLancamentos);
    filtroDataInicio.addEventListener('input',filtrarLancamentos);
    filtroDataFim.addEventListener('input',filtrarLancamentos);
    filtroCategoria.addEventListener('change',filtrarLancamentos);

    // Inicialização
    renderizarCategorias(); renderizarDescricoes(); renderizarTabela(); sincronizarDados();
});
