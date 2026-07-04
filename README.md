# Pokémon Veyra RPG

RPG retrô textual/visual fan-made de Pokémon com visual retrô inspirado na era Game Boy Color / Pokémon Crystal.

**Criação:** Luiz Matheus — Luix Studios

## Versão atual

**v1.4.0 — Overworld & Battle Polish**

Esta versão corrige a sensação de protótipo: separa melhor menu/jogo, simplifica os comandos, adiciona introdução jogável, representação visual em sprites, rotas por passos e uma tela de batalha mais próxima dos jogos clássicos.

## O que já tem

- História própria na Região Veyra
- Cidades, rotas, floresta, caverna, área pós-jogo e ginásios
- Exploração por passos nas rotas, com encontros selvagens, itens, NPCs e treinadores
- Rival recorrente com equipe ajustada ao inicial escolhido
- Batalha por turnos com menu `Lutar / Mochila / Pokémon / Fugir`, HUD com nome, level, HP, EXP e slots da equipe
- Tipos, efetividade, PP, dano, crítico, status, EXP e evolução
- Captura com Poké Bola e Grande Bola, com chance baseada em HP/status
- Equipe, Box, mochila, Pokédex visual, dinheiro e insígnias
- Loja, Centro Pokémon, save local e configurações
- Mapa da região, Diário com objetivo atual e progresso
- Atalhos mobile fixos simplificados: Menu, Equipe, Mapa e Salvar
- Sprites de Pokémon/itens carregados do repositório público da PokéAPI e sprites CSS próprios para personagens/cenários
- Pronto para GitHub Pages, sem Vite, sem React e sem processo de build

## Como rodar

Abra o arquivo `index.html` no navegador.

Para publicar no GitHub Pages:

1. Crie um repositório no GitHub.
2. Envie estes arquivos para a branch `main`.
3. Vá em **Settings > Pages**.
4. Em **Build and deployment**, escolha **Deploy from a branch**.
5. Selecione `main` e pasta `/root`.
6. Salve e aguarde o link ficar disponível.

## Estrutura

```txt
index.html        Tela principal
styles.css        Visual retrô, mobile e PWA
src/data.js       Pokémon, golpes, itens, locais, NPCs e treinadores
src/game.js       Motor do jogo, save, batalha e interface
manifest.webmanifest  Configuração de instalação como app
sw.js             Cache básico para PWA
.nojekyll         Evita processamento do GitHub Pages
```

## Mobile / instalar como app

Esta versão foi preparada para celular:

- layout responsivo para telas pequenas;
- botões maiores para toque;
- suporte a área segura do iPhone;
- `manifest.webmanifest` para instalação como PWA;
- `apple-touch-icon` e metatags para iPhone/iPad;
- `sw.js` com cache básico dos arquivos principais;
- dock inferior com atalhos para jogar mais rápido no celular.

### No iPhone

1. Publique o jogo no GitHub Pages.
2. Abra o link no Safari.
3. Toque em **Compartilhar**.
4. Escolha **Adicionar à Tela de Início**.
5. Confirme o nome **Veyra** ou **Pokémon Veyra**.

Depois disso, o jogo aparece como um app na tela inicial. O save fica salvo no próprio aparelho pelo `localStorage`.

## Créditos de assets

Os sprites de Pokémon e itens são carregados via URLs públicas do projeto PokéAPI Sprites.

Este é um projeto fã para estudo/portfólio. Pokémon, nomes, sprites e marcas pertencem aos seus respectivos donos. O código, montagem, progressão, interface e adaptação deste projeto são de Luiz Matheus / Luix Studios.


## Log v1.4.0

- Corrigido o problema visual de menu e tela do jogo aparecerem juntos com regras CSS mais fortes para telas ativas.
- Menus de campo simplificados para quatro ações principais.
- Adicionado **Menu** único com Equipe, Bolsa, Pokédex, Diário, Mapa, Save, Config e Box quando disponível.
- Adicionada introdução jogável com quarto, mãe, cidade, laboratório e Professor Aroeira antes da escolha do inicial.
- Adicionada representação visual do mundo com sprites CSS, cenário de quarto/lab/cidade/rota/floresta/caverna/lago e Pokémon selvagem no mapa.
- Rotas, floresta, caverna e lago agora têm progresso por passos antes de liberar a saída seguinte.
- Exploração menos instantânea: avançar pode gerar treinador, item, encontro ou passo vazio.
- Batalha reformulada com HUD mais próximo dos jogos: nome, level, slots de Poké Bola, barra de HP, número de HP e barra de EXP.
- Pokédex agora abre detalhes do Pokémon visto, mostrando tipo, locais e golpes aprendidos.
- Tela da equipe agora mostra sprite, HP, EXP, stats e golpes em cards.
- Adicionadas animações simples de caminhar, Pokémon parado, flash de dano, captura e transições de barra.

## Log v1.2.4

- Nome alterado para **Pokémon Veyra**.
- Região renomeada para **Região Veyra**.
- Cidade inicial renomeada para **Cove**.
- Segunda cidade renomeada para **Noxport**.
- Pós-jogo renomeado para **North Reef** e **Mistpoint**.
- Ginásio final renomeado para **Ginásio Noxport**.
- Ícones do app/atalho refeitos com a sigla **VY**.

## Log v1.2

- Adicionado Mapa da Região Veyra.
- Adicionado Diário com objetivo atual.
- Adicionado dock mobile com atalhos rápidos.
- Adicionados NPCs com falas úteis por local.
- Adicionado rival Niko em dois momentos da jornada.
- Adicionado Mistpoint como área pós-jogo.
- Adicionados Eevee e Dratini como espécies raras.
- Adicionada Grande Bola.
- Melhorada a IA inimiga para escolher golpes mais efetivos.
- Adicionados golpes críticos e dano residual de veneno/queimadura.
- Corrigido dano de golpes sem efeito para causar 0.
- Melhorada a Pokédex visual com cards e sprites.


## v1.4 — Presentation & Audio Update

Esta versão corrigiu a sensação de protótipo e deixou a apresentação mais próxima de um jogo retrô:

- troca dos sprites de Pokémon para o endpoint transparente padrão da PokéAPI, removendo o visual de fundo branco;
- sprites locais autorais em pixel art para jogador, NPC, professor, mãe, rival, enfermeira e lojista;
- botões reorganizados com ícones e leitura mais clara no mobile;
- transição de início de batalha com efeito circular para selvagens e wipe para treinadores/ginásio;
- animações de entrada, ataque, dano, captura e derrota;
- barra de HP/EXP com transição visual;
- sons gerados por Web Audio: clique, passos, batalha, dano, cura, captura, derrota, vitória e level up;
- música simples estilo chiptune para menu, exploração e batalha;
- novas opções em Configurações: música, efeitos sonoros e volume;
- service worker atualizado para cachear os sprites locais.

### Sobre sprites externos

Os sprites de Pokémon e itens continuam vindo do repositório público da PokéAPI. Para personagens/NPCs, esta versão usa sprites autorais locais para evitar empacotar artes ripadas de ROMs. Se você quiser trocar depois por sprites de algum pack, substitua os arquivos em `assets/sprites/` mantendo os mesmos nomes.
