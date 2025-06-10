# 🌟 Hygromanteia - Horas Planetárias

Uma aplicação web moderna para calcular e exibir as horas planetárias baseadas na sua localização, com integração de manuscritos históricos medievais.

## ✨ Funcionalidades

### 🕒 Horas Planetárias Precisas
- **Cálculos Astronômicos**: Baseados nos horários reais de nascer e pôr do sol
- **Precisão Geográfica**: Usa sua localização atual ou permite inserir qualquer cidade
- **Ordem Caldéica**: Seguindo a tradição astrológica clássica
- **Atualização em Tempo Real**: Timer que atualiza automaticamente

### 🌍 Localização Inteligente
- **Detecção Automática**: GPS do navegador para localização precisa
- **Busca Manual**: Insira qualquer cidade do mundo
- **Geocoding Avançado**: Integração com APIs de geolocalização
- **Fallback Inteligente**: Cálculos aproximados se APIs falharem

### 🗓️ Navegação Temporal
- **Seletor de Data**: Explore horas planetárias de qualquer data
- **Navegação por Horas**: Botões para navegar entre as 24 horas
- **Progresso Visual**: Barra de progresso da hora atual
- **Controle de Tempo**: Volte ao "agora" com um clique

### 📜 Manuscritos Históricos
- **Três Manuscritos Medievais**:
  - Harleianus
  - Monacensis  
  - Gennadianus
- **Recomendações Contextuais**: Baseadas no dia e hora atual
- **Filtragem Inteligente**: Remove entradas vazias automaticamente

## 🛠️ Stack Tecnológica

### Frontend
- **Next.js 15.2.4** - Framework React com App Router
- **React 19.1.0** - Biblioteca principal
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização utilitária
- **shadcn/ui** - Componentes baseados em Radix UI

### APIs Integradas
- **OpenStreetMap Nominatim** - Geocoding
- **BigDataCloud** - Geolocalização reversa
- **Sunrise-sunset.org** - Horários astronômicos precisos
- **Navigator.geolocation** - GPS do navegador

## 🚀 Deploy

### Railway
Este projeto está otimizado para deploy no Railway:

1. **Conecte o repositório** ao Railway
2. **Configure as variáveis** (não necessárias para este projeto)
3. **Deploy automático** será executado

### Vercel
Também compatível com Vercel:

```bash
npm install -g vercel
vercel --prod
```

## 💻 Desenvolvimento Local

### Pré-requisitos
- Node.js 18+ 
- pnpm (recomendado) ou npm

### Instalação
```bash
# Clone o repositório
git clone https://github.com/jorujes/hygromanteia.git
cd hygromanteia

# Instale as dependências
pnpm install

# Execute o servidor de desenvolvimento
pnpm dev
```

Acesse `http://localhost:3000` no seu navegador.

## 🎨 Características Visuais

### Design Responsivo
- **Mobile-first**: Funciona perfeitamente em dispositivos móveis
- **Breakpoints**: Adaptação automática para tablet e desktop
- **Tipografia Escalável**: Tamanhos que se ajustam ao dispositivo

### Interface Intuitiva
- **Símbolos Astrológicos**: Unicode para todos os planetas
- **Cores Harmoniosas**: Paleta neutra e elegante
- **Animações Suaves**: Transições CSS para melhor UX
- **Feedback Visual**: Estados hover e loading

## 🔧 Configuração

### Estrutura de Dados
Os manuscritos históricos estão em `public/data/planetary_hours.json`:

```json
{
  "Dia": "Domingo",
  "Hora": "1ª",
  "Planeta": "Sol",
  "Harleianus": "Recomendação do manuscrito...",
  "Monacensis": "Recomendação do manuscrito...",
  "Gennadianus": "Recomendação do manuscrito..."
}
```

### Personalização
- **Cores**: Modifique `tailwind.config.ts`
- **Componentes**: Customize em `components/ui/`
- **Cálculos**: Ajuste em `app/page.tsx`

## 📚 Documentação Técnica

### Principais Componentes
- **HygromanteiApp**: Componente principal
- **calculatePlanetaryHours**: Cálculos das horas planetárias
- **searchLocationByName**: Geocoding de cidades
- **getPlanetaryHourRecommendations**: Busca nos manuscritos

### Ordem Caldéica dos Planetas
```
Sol → Vênus → Mercúrio → Lua → Saturno → Júpiter → Marte
```

### Mapeamento Dias/Planetas
- **Domingo**: Sol ☉
- **Segunda**: Lua ☾  
- **Terça**: Marte ♂
- **Quarta**: Mercúrio ☿
- **Quinta**: Júpiter ♃
- **Sexta**: Vênus ♀
- **Sábado**: Saturno ♄

## 🌟 Contribuições

Contribuições são bem-vindas! Por favor:

1. **Fork** o repositório
2. **Crie uma branch** para sua feature
3. **Commit** suas mudanças
4. **Push** para a branch
5. **Abra um Pull Request**

## 📄 Licença

Este projeto é open source. Veja o arquivo `LICENSE` para detalhes.

## 🙏 Agradecimentos

- **Manuscritos Medievais**: Fontes históricas preservadas
- **APIs Gratuitas**: OpenStreetMap, BigDataCloud, Sunrise-sunset
- **Comunidade Open Source**: shadcn/ui, Tailwind CSS, Next.js

---

**Hygromanteia** - *Explorando as horas planetárias com precisão astronômica e sabedoria ancestral* ✨🔮 