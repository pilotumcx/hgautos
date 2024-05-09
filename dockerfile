# Usar uma imagem base do Node.js específica
FROM node:20.10.0

# Definir o diretório de trabalho no container
WORKDIR /usr/hgbaileysLinux2

# Copiar os arquivos de dependências primeiro para aproveitar o cache do Docker
COPY package*.json ./

# Instalar todas as dependências do projeto
RUN npm install

# Instalar TypeScript globalmente

# Copiar todos os arquivos do projeto para o container
COPY . .

# Compilar o projeto
RUN npm run build

# Expõe a porta 5000 para o container
EXPOSE 7003

# Comando para iniciar a aplicação
CMD ["npm", "start"]