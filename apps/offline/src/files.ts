import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Picker from 'expo-document-picker';
import * as Print from 'expo-print';
export async function exportText(name: string, content: string, mime = 'application/json') {
  if (!(await Sharing.isAvailableAsync()))
    throw new Error('Compartilhamento indisponível neste aparelho.');
  const file = new File(Paths.cache, name);
  file.write(content);
  await Sharing.shareAsync(file.uri, { mimeType: mime, dialogTitle: 'Salvar arquivo do CORE' });
}
export async function importText() {
  const result = await Picker.getDocumentAsync({
    type: ['application/json', 'text/plain'],
    copyToCacheDirectory: true,
  });
  if (result.canceled) return null;
  const file = new File(result.assets[0].uri);
  if (file.size > 20_000_000) throw new Error('Backup excede o limite de 20 MB.');
  return file.text();
}
export async function exportReport(html: string) {
  const result = await Print.printToFileAsync({ html });
  await Sharing.shareAsync(result.uri, {
    mimeType: 'application/pdf',
    UTI: '.pdf',
    dialogTitle: 'Relatório CORE',
  });
}
