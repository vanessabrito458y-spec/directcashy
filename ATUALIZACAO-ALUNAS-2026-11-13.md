# Atualização DirectCash — 13/11/2026

Código: `editor-2026-11-13`

## Importante
O login unificado passou nos testes locais e simulados. A autorização e o envio reais com aplicativo Meta novo ainda precisam ser validados. Esta versão é disponibilizada para atualização manual; “recomendado” permanece na versão anterior.

## Para quem já tem o atualizador no GitHub
1. Entre no GitHub e abra seu repositório DirectCash.
2. Toque em Actions (Ações) e abra Atualizar DirectCA$H.
3. Toque em Run workflow (Executar fluxo de trabalho).
4. No campo versao, substitua o valor por: editor-2026-11-13
5. Toque no botão verde Run workflow e aguarde terminar com sucesso.
6. Na Cloudflare, abra seu Worker → Implantações. Aguarde a nova implantação terminar. O sucesso no GitHub sozinho não confirma a publicação do painel.
7. Reabra seu painel e consulte Configuração. Agora existe a escolha entre login anterior e login unificado.

Se não aparecer o atualizador em Actions, estas etapas não se aplicam: primeiro instale o arquivo de atualização pelo guia da Central. Não cole o código de versão em um arquivo do projeto ou no terminal.

## Para um aplicativo Meta com login unificado
1. Escolha Login unificado — aplicativos novos na Configuração do DirectCash.
2. Use o App ID e a chave secreta de Configurações do app → Básico, na Meta.
3. No campo separado config_id, use a Identificação da configuração criada em Configure seu app.
4. Salve e copie a URL de retorno para o campo URL de redirecionamento da Meta.
5. Prepare a conta testadora e os webhooks conforme o guia do painel.
6. Conecte uma conta do Instagram por vez; depois use Verificar conexão e faça um novo comentário de teste.

Quem já está conectado pelo login anterior deve manter essa opção. Não apague a conta, o banco nem as credenciais existentes. Tokens do login unificado não são renovados automaticamente nesta versão; reconecte se a Meta revogar ou expirar o acesso.
