# Política de Privacidade do Smart Scroll Navigator

**Última atualização**: 14 de junho de 2026

## Coleta de dados

Durante o uso normal de rolagem, o Smart Scroll Navigator **não** coleta nem transmite histórico, URLs ou domínios visitados, títulos ou conteúdo de páginas, pesquisas, formulários, posições, marcadores ou contas. A única exceção são os dados enviados expressamente pelo formulário opcional descrito abaixo.

A extensão inclui estatísticas anônimas de uso opcionais. Esse recurso fica desativado por padrão para usuários novos e existentes. Os dados só são coletados e transmitidos depois que você ativa expressamente **Enviar estatísticas anônimas de uso** na página de opções.

Quando ativada, a extensão pode enviar:

- Configurações enumeradas ou agrupadas por faixas, como layout dos botões, faixa de tamanho, estilo de ícones e opções das ferramentas de leitura.
- Contagens diárias agregadas em UTC de ações permitidas, como uso dos botões de topo/fim, comandos de teclado, saltos de progresso, ações de marcadores e do índice.
- Contagens diárias agregadas em UTC de ativações ou desativações da extensão e de recursos avançados.
- A versão da extensão e o idioma de interface selecionado.

A solicitação de estatísticas não contém URLs, domínios, títulos, texto de páginas, dados de marcadores, listas de sites ativados, cores personalizadas exatas, identificadores persistentes de usuário, identificadores de publicidade ou impressões digitais do dispositivo. A extensão não cria um ID permanente de instalação ou de usuário.

## Armazenamento local

A extensão usa a API de armazenamento integrada do Chrome (`chrome.storage.sync`) para salvar preferências como velocidade de rolagem, posição dos botões, cores, opacidade e configurações das ferramentas de leitura. Esses dados são sincronizados pela infraestrutura do Google entre os dispositivos conectados ao Chrome. Quando as estatísticas opcionais estão ativadas, somente o subconjunto enumerado ou agrupado descrito acima pode ser enviado; valores personalizados exatos não são transmitidos.

Ao usar os recursos correspondentes, a extensão também pode utilizar `chrome.storage.local` para salvar o estado de ativação por site e marcadores de posição de rolagem. Esses marcadores contêm a URL, o progresso aproximado, o título da página e metadados relacionados ao contêiner de rolagem para permitir a retomada posterior. Os dados permanecem no navegador e não são transmitidos ao desenvolvedor nem a terceiros.

Quando a navegação inteligente por seções está ativada, a extensão pode ler os títulos visíveis da página atual para criar um índice em memória. O índice, os textos dos títulos e a estrutura da página não são salvos no armazenamento do Chrome nem transmitidos ao desenvolvedor ou a terceiros.

O consentimento para estatísticas, até sete dias UTC de contagens agregadas pendentes e um lote temporário de nova tentativa ficam em `chrome.storage.local`. Desativar as estatísticas interrompe imediatamente a nova coleta, remove os dados pendentes, encerra o agendamento de envios e revoga as permissões opcionais. As estatísticas agregadas já recebidas pelo servidor expiram de acordo com os prazos abaixo.

## Permissões de host

A extensão solicita permissões amplas de host (`<all_urls>`) exclusivamente para inserir botões flutuantes de rolagem nas páginas. Essa permissão é necessária para sua função principal. A extensão **não** lê, intercepta, coleta, armazena nem transmite o conteúdo das páginas visitadas.

A permissão do endpoint de estatísticas e a permissão de agendamento `alarms` são opcionais. O Chrome só as solicita quando você ativa as estatísticas anônimas. Elas são usadas apenas para enviar lotes agregados com tamanho limitado para:

`https://page-scroll-master-analytics.kscje-apps.workers.dev/v1/events`

## Processamento e retenção das estatísticas

O endpoint é operado pelo desenvolvedor da extensão por meio do Cloudflare Workers e Cloudflare D1. Não são usados SDKs de estatísticas de terceiros, redes de publicidade, pixels de rastreamento, cookies, scripts remotos ou corretores de dados.

Os lotes aceitos são imediatamente convertidos em contadores diários agregados. Eventos de ações individuais não são armazenados. IDs aleatórios de lote, usados apenas para evitar duplicação em novas tentativas, são mantidos por até 30 dias. As estatísticas diárias agregadas são mantidas por até 13 meses.

A Cloudflare pode processar metadados comuns de rede, incluindo endereço IP e cabeçalhos da solicitação, para fornecer e proteger o serviço de acordo com suas políticas de infraestrutura. A extensão não adiciona URLs de páginas, referenciadores, dados personalizados de agente do usuário ou identificadores persistentes às solicitações. O desenvolvedor não usa metadados de rede para identificar usuários ou criar perfis.

Os dados são usados apenas para avaliar o uso de recursos, a distribuição de configurações, os valores padrão e as prioridades do produto. Eles não são vendidos, usados para publicidade ou compartilhados para criação de perfis.

## Sugestões e feedback

O formulário opcional só envia dados após a confirmação. São enviados tipo, mensagem, versão da extensão e idioma da interface. Contato e até três imagens JPEG, PNG ou WebP só são enviados quando fornecidos. O formulário não coleta a URL atual nem o idioma do navegador. A extensão não salva o conteúdo.

O serviço usa Cloudflare Workers e D1 e o Resend para encaminhar o email. Um hash com salt do endereço de rede é usado apenas para o limite por hora; o IP em texto simples não é armazenado. Apenas logs sem conteúdo são mantidos por até 30 dias. Mensagem, contato e imagens não são salvos no D1. A permissão opcional de host é solicitada no envio e revogada ao final.

## Uso limitado da Chrome Web Store

O uso de informações recebidas das APIs do Chrome está em conformidade com a [Política de Dados do Usuário da Chrome Web Store](https://developer.chrome.com/docs/webstore/program-policies/limited-use), incluindo os requisitos de Uso Limitado. Os dados são usados somente para fornecer ou melhorar a finalidade única da extensão e não são transferidos nem usados para publicidade personalizada, decisões de crédito ou venda a corretores de dados.

## Privacidade infantil

A extensão não coleta intencionalmente informações pessoais de ninguém, incluindo crianças menores de 13 anos.

## Alterações nesta política

Qualquer alteração nesta política será refletida em uma versão atualizada da extensão e nesta página.

## Contato

Em caso de dúvidas sobre esta política: **kscj.ty@gmail.com**
