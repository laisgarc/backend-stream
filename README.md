# Back-End - Stream Overlay

Back-End de um projeto para criação de overlays para LoL. 
É um servidor node, que usa o [LCU Connector](https://github.com/sousa-andre/ws4lcu-connector) para buscar as informações via websocket no Client do LoL.

## Como usar

⚠️ **Antes de iniciar o servidor, certifique-se de que o Client do LoL já está aberto** ⚠️
Esse é um bug a ser corrigido nas próximas versões

Para iniciar o servidor basta rodar
` npm start `
O servidor estará rodando na porta 30061.

### Teste com JSON

Criei um JSON com as entradas simulando um matchup. Caso queira testar o overlay de matchup, é preciso:
###### Criar uma REST API com os dados
Você pode fazer isso de diversas maneiras, mas uma fácil é usando o [Mockoon](https://mockoon.com/), abra a REST API em `3001`, e crie a rota `/data`. Então, selecionando a operação `GET`, copie e cole o conteúdo do arquivo `testePicks.json`. Caso queira editar para que o servidor busque esses dados em outra URL, troque eles na função `createData()` dentro do arquivo `node.server.js`
###### Próximos passos
Em `node.server.js` seter a variável 'useLCU' como `false`. Isso fará com que o servidor busque as informações na REST API, ao invés de esperar um evento do Client.


## To-Do
- [ ] Corrigir bug do login no Client
- [ ] Conectar OBS
- [ ] Buscar informações sobre players da partida