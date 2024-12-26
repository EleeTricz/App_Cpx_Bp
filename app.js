let storedResults = [];


async function fetchApiData() {
    try {
        const response = await axios.get('https://api-cpx-b555.onrender.com/api/data'); // Atualize com a URL da sua API
            return response.data.data.dados;
    } catch (error) {
        console.error('Erro ao buscar dados da API:', error.message);
        throw new Error('Não foi possível buscar os dados da API.');
    }
}

async function compareData() {
    const data_inicio = document.getElementById('data_inicio').value;
    const data_final = document.getElementById('data_final').value;
    const inputText = document.getElementById('inputLocalList').value; // Pega o valor do textarea
    const localList = inputText.split('\n'); // Separa os itens por linha

    await fetchApiData().then(apiData => {
        const cleanedList = cleanLocalList(localList);
        const uniqueKeys = extractUniqueKeys(cleanedList); // Extrai os IDs da lista local
        const matches = findMatchingIds(uniqueKeys, apiData);
        storedResults = matches; // Armazena os resultados na variável
        // Se quiser salvar no localStorage (para persistir após recarregar a página):
        localStorage.setItem('matchResults', JSON.stringify(storedResults));
    }).catch(error => {
        console.error('Erro ao buscar dados da API:', error.message);
    });
    
    const data = await processarConsultaPonto(data_inicio, data_final);
    return data;

}

function cleanLocalList(localList) {
    // Aplica cleanString a cada item da lista local
    const cleanedList = localList.map(item => cleanString(item));

    return cleanedList; // Retorna a lista limpa
}


function extractUniqueKeys(cleanedLocalList) {
    

    // Extrai os números dos usuários a partir da lista local
    return cleanedLocalList.map(item => {
        const match = item.match(/\| (\d+)$/);
        return match ? match[1] : null;
    }).filter(id => id); // Remove IDs nulos
}

function findMatchingIds(uniqueKeys, apiData) {
    return uniqueKeys.map(key => {
        const match = apiData.find(apiItem => {
            const apiKey = cleanString(apiItem.nome_usuario).match(/\|\s*(\d+)$/); // Extrai e limpa o número da API
            return apiKey && apiKey[1] === key; // Compara os números
        });
        return match ? { key, id_usuario: match.id_usuario } : null;
    }).filter(item => item !== null); // Remove valores inválidos
}

function cleanString(str) {
    return str.replace(/\s+/g, ' ')      // Substitui múltiplos espaços por um único espaço
                  .trim();                  // Remove espaços no início e no final
}



// Agora você pode chamar a função para enviar os dados
async function processarConsultaPonto(data_inicio, data_final) {
    // Extrai os id_usuario dos resultados armazenados
    let usuarios = storedResults.map(result => result.id_usuario);

    if (usuarios.length > 0) {
        const data = await enviarDadosParaConsultaPonto(usuarios, data_inicio, data_final);
        return data;
    } else {
        console.error('Nenhum usuário encontrado.');
    }
}


// Função para pegar o valor do textarea e obter os ids de usuários
async function processarConsulta() {
     const data = await compareData();
     return data;
}

// Função para formatar a data no formato DD/MM/YYYY, levando em conta o fuso horário local
function formatDate(date) {
    const d = new Date(date); // Cria um objeto Date a partir da string
    d.setMinutes(d.getMinutes() + d.getTimezoneOffset()); // Ajusta para o fuso horário local
    const day = d.getDate().toString().padStart(2, '0'); // Garante 2 dígitos no dia
    const month = (d.getMonth() + 1).toString().padStart(2, '0'); // Garante 2 dígitos no mês
    const year = d.getFullYear(); // Ano com 4 dígitos
    return `${day}/${month}/${year}`;
}


// Função para enviar os dados para a API de consulta de ponto
async function enviarDadosParaConsultaPonto(usuarios, data_inicio, data_final, guarnicao = document.getElementById('guarnicao').value , registro_deletado = "0") {
    const apiUrl = 'https://api-cpx-b555.onrender.com/api/consulta-ponto';

    const data_inicio_formatada = formatDate(data_inicio);
    const data_final_formatada = formatDate(data_final);
    

    // Montar o objeto de dados
    const dados = {
        data_inicio: data_inicio_formatada,
        data_final: data_final_formatada,
        usuarios: usuarios.map(id => id.toString()),
        guarnicao: guarnicao.toString(),
        registro_deletado: registro_deletado
    };

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dados)
        });

        if (response.ok) {
            const responseData = await response.json();
            console.log('Dados recebidos da API externa:', responseData);
            alert('Consulta realizada com sucesso!');
            return responseData;
        } else {
            console.error('Erro na requisição para a API externa:', response.status);
            alert('Erro ao realizar a consulta.');
        }
    } catch (error) {
        console.error('Erro ao enviar dados:', error);
        alert('Erro ao enviar os dados.');
    }
}
