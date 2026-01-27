# Instrução para Configurar o Favicon

Para que o ícone "C" apareça na aba do navegador, você precisa copiar manualmente o arquivo:

**De:** `src/assets/images/logo-icon.png`  
**Para:** `public/favicon.png`

Você pode fazer isso:
1. Abrindo o Finder
2. Navegando até a pasta do projeto
3. Copiando o arquivo `logo-icon.png` da pasta `src/assets/images/`
4. Colando na pasta `public/` e renomeando para `favicon.png`

Ou pelo terminal:
```bash
cp src/assets/images/logo-icon.png public/favicon.png
```

Depois disso, recarregue o navegador e o ícone "C" aparecerá na aba!
