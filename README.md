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

Em `node.server.js` seter a variável 'useLCU' como `false`. Isso fará com que o servidor busque as informações na JSON `testePicks.json`, ao invés de esperar um evento do Client.

### Configurando com o Front-End
Para que o servidor possa rodar corretamente com o front-end, o diretório deve seguir esse formato:
```
projeto
└───back-end
│   │ este repositório  
│
└───overlays
    │   repositório do front-end
```


## To-Do
- [ ] Corrigir bug do login no Client
- [ ] Conectar OBS
- [ ] Buscar informações sobre players da partida