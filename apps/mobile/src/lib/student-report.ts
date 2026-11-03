import { Platform } from 'react-native';
import { Asset } from 'expo-asset';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import type { Student, Professional } from '@core/domain';

async function fontBytes(moduleId: number) {
  const asset = Asset.fromModule(moduleId);
  if (Platform.OS === 'web') {
    const response = await fetch(asset.uri);
    if (!response.ok) throw new Error('Não foi possível carregar a fonte do relatório.');
    return new Uint8Array(await response.arrayBuffer());
  }
  await asset.downloadAsync();
  if (!asset.localUri) throw new Error('Fonte do relatório indisponível.');
  return new File(asset.localUri).bytes();
}
export async function exportStudentReport(students: Student[], professional: Professional) {
  const [{ createStudentReport }, regularFont, boldFont] = await Promise.all([
    import('@core/reports'),
    fontBytes(require('../../assets/fonts/NotoSans-Regular.ttf')),
    fontBytes(require('../../assets/fonts/NotoSans-Bold.ttf')),
  ]);
  const bytes = await createStudentReport({ students, professional, regularFont, boldFont });
  const filename = `core-alunos-${new Date().toISOString().slice(0, 10)}.pdf`;
  if (Platform.OS === 'web') {
    const blob = new Blob([new Uint8Array(bytes).buffer], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob),
      anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
    return;
  }
  if (!(await Sharing.isAvailableAsync()))
    throw new Error('O compartilhamento de arquivos não está disponível neste aparelho.');
  const file = new File(Paths.cache, `${Date.now()}-${filename}`);
  file.create();
  file.write(bytes);
  await Sharing.shareAsync(file.uri, {
    mimeType: 'application/pdf',
    UTI: 'com.adobe.pdf',
    dialogTitle: 'Relatório de alunos',
  });
}
