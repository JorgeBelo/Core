# Como Adicionar a Fonte AC Soft Icecream

Para usar a fonte **AC Soft Icecream** original (gordinha e redondinha), você precisa adicionar o arquivo da fonte no projeto.

## Passos:

1. **Obtenha o arquivo da fonte AC Soft Icecream**
   - Formato recomendado: `.woff2` ou `.woff`
   - Você pode baixar de: https://www.onlinewebfonts.com/fonts/ac_soft_icecream

2. **Coloque o arquivo na pasta:**
   ```
   src/assets/fonts/AC-Soft-Icecream.woff2
   ```
   ou
   ```
   src/assets/fonts/AC-Soft-Icecream.woff
   ```

3. **O sistema já está configurado!** 
   - A fonte será carregada automaticamente
   - Se o arquivo não existir, usará fontes alternativas (Bubblegum Sans, Chewy, etc.)

## Fontes Alternativas Atuais

Enquanto a fonte original não está disponível, o sistema usa estas fontes como fallback (em ordem de prioridade):
1. **Bubblegum Sans** - Muito gordinha e redondinha
2. **Chewy** - Gordinha e divertida
3. **Fredoka One** - Gordinha e moderna
4. **Comfortaa** - Suave e arredondada

Essas fontes são carregadas do Google Fonts automaticamente.

## Verificar se a fonte está funcionando

Após adicionar o arquivo da fonte, recarregue a página e verifique se a logo "Core" está usando a fonte correta. Se ainda não estiver, verifique o console do navegador (F12) para ver se há erros de carregamento.
