# Pokémon Veyra RPG

RPG textual fan-made de Pokémon com visual retrô inspirado na era Game Boy Color / Pokémon Crystal.

**Criação:** Luiz Matheus — Luix Studios

## Versão atual

**v1.2.4 — Veyra Identity Update**

Esta versão mantém a base PWA/mobile e troca o nome para algo mais curto, sonoro e com cara de marca própria: **Pokémon Veyra**.

A ideia é fugir dos nomes comuns de hack rom baseados em cor, pedra, luz, sombra, cristal, prisma ou clima.

## O que já tem

- História própria na Região Veyra
- Cidades, rotas, floresta, caverna, área pós-jogo e ginásios
- Exploração com encontros selvagens, itens, NPCs e treinadores
- Rival recorrente com equipe ajustada ao inicial escolhido
- Batalha por turnos com menu `Lutar / Mochila / Pokémon / Fugir`
- Tipos, efetividade, PP, dano, crítico, status, EXP e evolução
- Captura com Poké Bola e Grande Bola, com chance baseada em HP/status
- Equipe, Box, mochila, Pokédex visual, dinheiro e insígnias
- Loja, Centro Pokémon, save local e configurações
- Mapa da região, Diário com objetivo atual e progresso
- Atalhos mobile fixos: Mapa, Diário, Bolsa e Dex
- Sprites carregados do repositório público da PokéAPI
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
