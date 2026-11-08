export async function exportText(name: string, content: string, mime = 'application/json') {
  const url = URL.createObjectURL(new Blob([content], { type: mime }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export async function importText(): Promise<string | null> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.oncancel = () => resolve(null);
    input.onchange = async () => {
      try {
        const file = input.files?.[0];
        if (file && file.size > 20_000_000) throw new Error('Backup excede o limite de 20 MB.');
        resolve(file ? await file.text() : null);
      } catch (e) {
        reject(e);
      }
    };
    input.click();
  });
}
export async function exportReport(html: string) {
  const popup = window.open('', '_blank');
  if (!popup) throw new Error('Permita a abertura do relatório no navegador.');
  popup.document.write(html);
  popup.document.close();
  popup.focus();
  popup.print();
}
