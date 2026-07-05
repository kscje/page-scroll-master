const MAX_REQUEST_BYTES = 16 * 1024 * 1024;
const MAX_IMAGES = 3;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MIN_MESSAGE_LENGTH = 10;
const MAX_MESSAGE_LENGTH = 5000;
const MAX_CONTACT_LENGTH = 200;
const RATE_LIMIT_PER_HOUR = 5;
const LOG_RETENTION_DAYS = 30;
const MAX_UNINSTALL_REQUEST_BYTES = 32 * 1024;
const MIN_UNINSTALL_MESSAGE_LENGTH = 10;
const MAX_UNINSTALL_MESSAGE_LENGTH = 2000;
const MAX_UNINSTALL_REASONS = 10;

const FEEDBACK_TYPES = new Set([
  'feature',
  'bug',
  'compatibility',
  'translation',
  'other'
]);

const UNINSTALL_REASONS = new Set([
  'not_using',
  'buttons_interfere',
  'features_not_expected',
  'site_incompatible',
  'too_complex',
  'performance_issue',
  'privacy_permission',
  'found_alternative',
  'temporary_uninstall',
  'other'
]);

const UNINSTALL_REASON_LABELS = {
  not_using: 'Not using it often',
  buttons_interfere: 'Buttons block the page or interrupt reading',
  features_not_expected: 'Scrolling, progress, or bookmark features did not work as expected',
  site_incompatible: 'It was incompatible or did not work on some websites',
  too_complex: 'Settings felt too complex',
  performance_issue: 'Performance, lag, or page issues',
  privacy_permission: 'Privacy or permission concerns',
  found_alternative: 'Found another tool',
  temporary_uninstall: 'Temporary uninstall, may reinstall later',
  other: 'Other'
};

const LANGUAGE_CODES = new Set([
  'zh-CN',
  'zh-TW',
  'en-US',
  'es-ES',
  'ja-JP',
  'de-DE',
  'fr-FR',
  'pt-BR',
  'ko-KR',
  'it-IT',
  'ru-RU',
  'tr-TR',
  'id-ID'
]);

const IMAGE_SIGNATURES = {
  'image/jpeg': [[0xff, 0xd8, 0xff]],
  'image/png': [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]],
  'image/webp': [
    [0x52, 0x49, 0x46, 0x46],
    [0x57, 0x45, 0x42, 0x50]
  ]
};

function responseHeaders(origin) {
  const headers = {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff'
  };
  if (origin && origin.startsWith('chrome-extension://')) {
    headers['access-control-allow-origin'] = origin;
    headers.vary = 'Origin';
  }
  return headers;
}

function jsonResponse(body, status = 200, origin = '') {
  return new Response(JSON.stringify(body), {
    status,
    headers: responseHeaders(origin)
  });
}

function htmlResponse(body, status = 200) {
  return new Response(body, {
    status,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
      'referrer-policy': 'no-referrer',
      'content-security-policy': "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'"
    }
  });
}

function normalizeText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeLanguageCode(value) {
  const language = normalizeText(value);
  return LANGUAGE_CODES.has(language) ? language : 'en-US';
}

function renderUninstallSurveyPage(requestUrl) {
  const url = new URL(requestUrl);
  const language = normalizeLanguageCode(url.searchParams.get('lang'));
  const version = normalizeText(url.searchParams.get('version'));
  const translations = {
    'zh-CN': {
      title: '帮助我们改进 Smart Scroll Navigator',
      subtitle: '你为什么卸载？',
      message: '补充说明（可选）',
      contact: '联系方式（可选）',
      submit: '提交反馈',
      skip: '跳过',
      hint: '至少选择 1 个原因，或填写 10 个字符以上补充说明。',
      privacy: '只有点击提交后才会发送。不会发送访问网址、页面内容、书签、站点状态或设置明细。',
      success: '感谢你的反馈。',
      skipped: '已跳过。你可以直接关闭此页面。',
      error: '提交失败，请稍后再试。',
      reopen: '重新安装',
      github: 'GitHub',
      reasons: {
        not_using: '不常使用',
        buttons_interfere: '按钮遮挡页面或干扰阅读',
        features_not_expected: '滚动、进度条或书签功能不符合预期',
        site_incompatible: '在某些网站上不兼容或不起作用',
        too_complex: '设置太复杂',
        performance_issue: '性能、卡顿或页面异常',
        privacy_permission: '隐私或权限顾虑',
        found_alternative: '找到了其他替代工具',
        temporary_uninstall: '临时卸载，之后可能再安装',
        other: '其他'
      }
    },
    'zh-TW': {
      title: '協助我們改進 Smart Scroll Navigator',
      subtitle: '你為什麼解除安裝？',
      message: '補充說明（選填）',
      contact: '聯絡方式（選填）',
      submit: '提交回饋',
      skip: '跳過',
      hint: '請至少選擇 1 個原因，或填寫 10 個字元以上補充說明。',
      privacy: '只有按下提交後才會傳送。不會傳送瀏覽網址、頁面內容、書籤、網站狀態或設定明細。',
      success: '感謝你的回饋。',
      skipped: '已跳過。你可以直接關閉此頁面。',
      error: '提交失敗，請稍後再試。',
      reopen: '重新安裝',
      github: 'GitHub',
      reasons: {
        not_using: '不常使用',
        buttons_interfere: '按鈕遮擋頁面或干擾閱讀',
        features_not_expected: '捲動、進度條或書籤功能不符合預期',
        site_incompatible: '在某些網站不相容或無法使用',
        too_complex: '設定太複雜',
        performance_issue: '效能、卡頓或頁面異常',
        privacy_permission: '隱私或權限疑慮',
        found_alternative: '找到其他替代工具',
        temporary_uninstall: '暫時解除安裝，之後可能再安裝',
        other: '其他'
      }
    },
    'en-US': {
      title: 'Help us improve Smart Scroll Navigator',
      subtitle: 'Why did you uninstall?',
      message: 'Additional details (optional)',
      contact: 'Contact (optional)',
      submit: 'Submit feedback',
      skip: 'Skip',
      hint: 'Select at least one reason, or write 10 or more characters.',
      privacy: 'Nothing is sent until you submit. We do not send visited URLs, page content, bookmarks, site states, or settings details.',
      success: 'Thanks for your feedback.',
      skipped: 'Skipped. You can close this page.',
      error: 'Submission failed. Please try again later.',
      reopen: 'Reinstall',
      github: 'GitHub',
      reasons: UNINSTALL_REASON_LABELS
    },
    'es-ES': {
      title: 'Ayúdanos a mejorar Smart Scroll Navigator',
      subtitle: '¿Por qué lo desinstalaste?',
      message: 'Detalles adicionales (opcional)',
      contact: 'Contacto (opcional)',
      submit: 'Enviar comentarios',
      skip: 'Omitir',
      hint: 'Selecciona al menos un motivo o escribe 10 caracteres o más.',
      privacy: 'No se envía nada hasta que pulses Enviar. No enviamos URLs visitadas, contenido de páginas, marcadores, estados de sitios ni detalles de configuración.',
      success: 'Gracias por tus comentarios.',
      skipped: 'Omitido. Puedes cerrar esta página.',
      error: 'No se pudo enviar. Inténtalo más tarde.',
      reopen: 'Reinstalar',
      github: 'GitHub',
      reasons: {
        not_using: 'No lo usaba con frecuencia',
        buttons_interfere: 'Los botones tapaban la página o interrumpían la lectura',
        features_not_expected: 'El desplazamiento, progreso o marcadores no funcionaban como esperaba',
        site_incompatible: 'No era compatible o no funcionaba en algunos sitios',
        too_complex: 'La configuración era demasiado compleja',
        performance_issue: 'Rendimiento, lentitud o errores de página',
        privacy_permission: 'Dudas de privacidad o permisos',
        found_alternative: 'Encontré otra herramienta',
        temporary_uninstall: 'Desinstalación temporal, quizá lo reinstale',
        other: 'Otro'
      }
    },
    'ja-JP': {
      title: 'Smart Scroll Navigator の改善にご協力ください',
      subtitle: 'アンインストールした理由を教えてください',
      message: '補足説明（任意）',
      contact: '連絡先（任意）',
      submit: 'フィードバックを送信',
      skip: 'スキップ',
      hint: '理由を 1 つ以上選ぶか、10 文字以上入力してください。',
      privacy: '送信を押すまで何も送信されません。閲覧 URL、ページ内容、ブックマーク、サイト状態、設定詳細は送信しません。',
      success: 'フィードバックありがとうございます。',
      skipped: 'スキップしました。このページを閉じられます。',
      error: '送信できませんでした。後でもう一度お試しください。',
      reopen: '再インストール',
      github: 'GitHub',
      reasons: {
        not_using: 'あまり使わなかった',
        buttons_interfere: 'ボタンがページや読書の邪魔になった',
        features_not_expected: 'スクロール、進捗、ブックマーク機能が期待と違った',
        site_incompatible: '一部サイトで互換性がない、または動作しなかった',
        too_complex: '設定が複雑すぎた',
        performance_issue: 'パフォーマンス、遅延、ページ異常',
        privacy_permission: 'プライバシーや権限への懸念',
        found_alternative: '別のツールを見つけた',
        temporary_uninstall: '一時的なアンインストール、後で再インストールするかもしれない',
        other: 'その他'
      }
    },
    'de-DE': {
      title: 'Hilf uns, Smart Scroll Navigator zu verbessern',
      subtitle: 'Warum hast du deinstalliert?',
      message: 'Zusätzliche Details (optional)',
      contact: 'Kontakt (optional)',
      submit: 'Feedback senden',
      skip: 'Überspringen',
      hint: 'Wähle mindestens einen Grund oder schreibe mindestens 10 Zeichen.',
      privacy: 'Es wird nichts gesendet, bis du absendest. Besuchte URLs, Seiteninhalte, Lesezeichen, Website-Status oder Einstellungsdetails werden nicht gesendet.',
      success: 'Danke für dein Feedback.',
      skipped: 'Übersprungen. Du kannst diese Seite schließen.',
      error: 'Senden fehlgeschlagen. Bitte versuche es später erneut.',
      reopen: 'Neu installieren',
      github: 'GitHub',
      reasons: {
        not_using: 'Ich habe es selten genutzt',
        buttons_interfere: 'Die Buttons verdeckten die Seite oder störten beim Lesen',
        features_not_expected: 'Scrollen, Fortschritt oder Lesezeichen entsprachen nicht den Erwartungen',
        site_incompatible: 'Auf einigen Websites inkompatibel oder ohne Funktion',
        too_complex: 'Die Einstellungen waren zu komplex',
        performance_issue: 'Leistung, Ruckeln oder Seitenfehler',
        privacy_permission: 'Datenschutz- oder Berechtigungsbedenken',
        found_alternative: 'Ich habe ein anderes Tool gefunden',
        temporary_uninstall: 'Vorübergehend deinstalliert, möglicherweise spätere Neuinstallation',
        other: 'Sonstiges'
      }
    },
    'fr-FR': {
      title: 'Aidez-nous à améliorer Smart Scroll Navigator',
      subtitle: 'Pourquoi avez-vous désinstallé ?',
      message: 'Détails supplémentaires (facultatif)',
      contact: 'Contact (facultatif)',
      submit: 'Envoyer le retour',
      skip: 'Ignorer',
      hint: 'Sélectionnez au moins une raison ou écrivez 10 caractères ou plus.',
      privacy: 'Rien n’est envoyé avant validation. Nous n’envoyons pas les URL visitées, le contenu des pages, les favoris, l’état des sites ni les détails de réglages.',
      success: 'Merci pour votre retour.',
      skipped: 'Ignoré. Vous pouvez fermer cette page.',
      error: 'Échec de l’envoi. Réessayez plus tard.',
      reopen: 'Réinstaller',
      github: 'GitHub',
      reasons: {
        not_using: 'Je ne l’utilisais pas souvent',
        buttons_interfere: 'Les boutons masquaient la page ou gênaient la lecture',
        features_not_expected: 'Le défilement, la progression ou les favoris ne répondaient pas aux attentes',
        site_incompatible: 'Incompatible ou inopérant sur certains sites',
        too_complex: 'Les réglages étaient trop complexes',
        performance_issue: 'Performances, lenteurs ou anomalies de page',
        privacy_permission: 'Préoccupations de confidentialité ou d’autorisations',
        found_alternative: 'J’ai trouvé un autre outil',
        temporary_uninstall: 'Désinstallation temporaire, réinstallation possible',
        other: 'Autre'
      }
    },
    'pt-BR': {
      title: 'Ajude-nos a melhorar o Smart Scroll Navigator',
      subtitle: 'Por que você desinstalou?',
      message: 'Detalhes adicionais (opcional)',
      contact: 'Contato (opcional)',
      submit: 'Enviar feedback',
      skip: 'Pular',
      hint: 'Selecione pelo menos um motivo ou escreva 10 caracteres ou mais.',
      privacy: 'Nada é enviado até você confirmar. Não enviamos URLs visitados, conteúdo da página, favoritos, estados de sites ou detalhes de configurações.',
      success: 'Obrigado pelo feedback.',
      skipped: 'Ignorado. Você pode fechar esta página.',
      error: 'Falha ao enviar. Tente novamente mais tarde.',
      reopen: 'Reinstalar',
      github: 'GitHub',
      reasons: {
        not_using: 'Não usava com frequência',
        buttons_interfere: 'Os botões cobriam a página ou atrapalhavam a leitura',
        features_not_expected: 'Rolagem, progresso ou favoritos não atenderam ao esperado',
        site_incompatible: 'Incompatível ou sem funcionar em alguns sites',
        too_complex: 'Configurações complexas demais',
        performance_issue: 'Desempenho, travamentos ou problemas na página',
        privacy_permission: 'Preocupações com privacidade ou permissões',
        found_alternative: 'Encontrei outra ferramenta',
        temporary_uninstall: 'Desinstalação temporária, talvez reinstale depois',
        other: 'Outro'
      }
    },
    'ko-KR': {
      title: 'Smart Scroll Navigator 개선에 도움을 주세요',
      subtitle: '왜 제거하셨나요?',
      message: '추가 설명(선택)',
      contact: '연락처(선택)',
      submit: '피드백 제출',
      skip: '건너뛰기',
      hint: '이유를 하나 이상 선택하거나 10자 이상 입력하세요.',
      privacy: '제출하기 전에는 아무것도 전송되지 않습니다. 방문 URL, 페이지 내용, 북마크, 사이트 상태, 설정 세부 정보는 보내지 않습니다.',
      success: '피드백 감사합니다.',
      skipped: '건너뛰었습니다. 이 페이지를 닫아도 됩니다.',
      error: '제출에 실패했습니다. 나중에 다시 시도하세요.',
      reopen: '다시 설치',
      github: 'GitHub',
      reasons: {
        not_using: '자주 사용하지 않음',
        buttons_interfere: '버튼이 페이지를 가리거나 읽기를 방해함',
        features_not_expected: '스크롤, 진행률 또는 북마크 기능이 기대와 다름',
        site_incompatible: '일부 사이트에서 호환되지 않거나 작동하지 않음',
        too_complex: '설정이 너무 복잡함',
        performance_issue: '성능, 끊김 또는 페이지 이상',
        privacy_permission: '개인정보 또는 권한 우려',
        found_alternative: '다른 도구를 찾음',
        temporary_uninstall: '임시 제거, 나중에 다시 설치할 수 있음',
        other: '기타'
      }
    },
    'it-IT': {
      title: 'Aiutaci a migliorare Smart Scroll Navigator',
      subtitle: 'Perché hai disinstallato?',
      message: 'Dettagli aggiuntivi (facoltativo)',
      contact: 'Contatto (facoltativo)',
      submit: 'Invia feedback',
      skip: 'Salta',
      hint: 'Seleziona almeno un motivo o scrivi almeno 10 caratteri.',
      privacy: 'Non viene inviato nulla finché non confermi. Non inviamo URL visitati, contenuti pagina, segnalibri, stati dei siti o dettagli delle impostazioni.',
      success: 'Grazie per il feedback.',
      skipped: 'Saltato. Puoi chiudere questa pagina.',
      error: 'Invio non riuscito. Riprova più tardi.',
      reopen: 'Reinstalla',
      github: 'GitHub',
      reasons: {
        not_using: 'Non lo usavo spesso',
        buttons_interfere: 'I pulsanti coprivano la pagina o disturbavano la lettura',
        features_not_expected: 'Scorrimento, progresso o segnalibri non erano come previsto',
        site_incompatible: 'Incompatibile o non funzionante su alcuni siti',
        too_complex: 'Impostazioni troppo complesse',
        performance_issue: 'Prestazioni, rallentamenti o anomalie pagina',
        privacy_permission: 'Dubbi su privacy o permessi',
        found_alternative: 'Ho trovato un altro strumento',
        temporary_uninstall: 'Disinstallazione temporanea, potrei reinstallare',
        other: 'Altro'
      }
    },
    'ru-RU': {
      title: 'Помогите улучшить Smart Scroll Navigator',
      subtitle: 'Почему вы удалили расширение?',
      message: 'Дополнительные сведения (необязательно)',
      contact: 'Контакт (необязательно)',
      submit: 'Отправить отзыв',
      skip: 'Пропустить',
      hint: 'Выберите хотя бы одну причину или напишите не менее 10 символов.',
      privacy: 'Ничего не отправляется до отправки формы. Мы не отправляем посещенные URL, содержимое страниц, закладки, состояния сайтов или настройки.',
      success: 'Спасибо за отзыв.',
      skipped: 'Пропущено. Эту страницу можно закрыть.',
      error: 'Не удалось отправить. Повторите позже.',
      reopen: 'Установить снова',
      github: 'GitHub',
      reasons: {
        not_using: 'Редко использовалось',
        buttons_interfere: 'Кнопки закрывали страницу или мешали чтению',
        features_not_expected: 'Прокрутка, прогресс или закладки работали не так, как ожидалось',
        site_incompatible: 'Не работало или было несовместимо на некоторых сайтах',
        too_complex: 'Слишком сложные настройки',
        performance_issue: 'Производительность, зависания или ошибки страницы',
        privacy_permission: 'Опасения по поводу приватности или разрешений',
        found_alternative: 'Найден другой инструмент',
        temporary_uninstall: 'Временное удаление, возможно установлю позже',
        other: 'Другое'
      }
    },
    'tr-TR': {
      title: 'Smart Scroll Navigator’ı geliştirmemize yardım edin',
      subtitle: 'Neden kaldırdınız?',
      message: 'Ek açıklama (isteğe bağlı)',
      contact: 'İletişim (isteğe bağlı)',
      submit: 'Geri bildirim gönder',
      skip: 'Atla',
      hint: 'En az bir neden seçin veya 10 ya da daha fazla karakter yazın.',
      privacy: 'Gönderene kadar hiçbir şey iletilmez. Ziyaret edilen URL’ler, sayfa içeriği, yer imleri, site durumları veya ayar ayrıntıları gönderilmez.',
      success: 'Geri bildiriminiz için teşekkürler.',
      skipped: 'Atlandı. Bu sayfayı kapatabilirsiniz.',
      error: 'Gönderilemedi. Lütfen daha sonra tekrar deneyin.',
      reopen: 'Yeniden yükle',
      github: 'GitHub',
      reasons: {
        not_using: 'Sık kullanmıyordum',
        buttons_interfere: 'Düğmeler sayfayı kapatıyor veya okumayı bölüyordu',
        features_not_expected: 'Kaydırma, ilerleme veya yer imi özellikleri beklendiği gibi değildi',
        site_incompatible: 'Bazı sitelerde uyumsuzdu veya çalışmıyordu',
        too_complex: 'Ayarlar fazla karmaşıktı',
        performance_issue: 'Performans, takılma veya sayfa sorunları',
        privacy_permission: 'Gizlilik veya izin endişeleri',
        found_alternative: 'Başka bir araç buldum',
        temporary_uninstall: 'Geçici kaldırma, daha sonra yeniden yükleyebilirim',
        other: 'Diğer'
      }
    },
    'id-ID': {
      title: 'Bantu kami meningkatkan Smart Scroll Navigator',
      subtitle: 'Mengapa Anda menghapusnya?',
      message: 'Detail tambahan (opsional)',
      contact: 'Kontak (opsional)',
      submit: 'Kirim masukan',
      skip: 'Lewati',
      hint: 'Pilih minimal satu alasan, atau tulis 10 karakter atau lebih.',
      privacy: 'Tidak ada yang dikirim sampai Anda menekan kirim. Kami tidak mengirim URL yang dikunjungi, isi halaman, bookmark, status situs, atau detail pengaturan.',
      success: 'Terima kasih atas masukannya.',
      skipped: 'Dilewati. Anda dapat menutup halaman ini.',
      error: 'Gagal mengirim. Coba lagi nanti.',
      reopen: 'Pasang ulang',
      github: 'GitHub',
      reasons: {
        not_using: 'Jarang digunakan',
        buttons_interfere: 'Tombol menutupi halaman atau mengganggu membaca',
        features_not_expected: 'Fitur gulir, progres, atau bookmark tidak sesuai harapan',
        site_incompatible: 'Tidak kompatibel atau tidak bekerja di beberapa situs',
        too_complex: 'Pengaturan terlalu rumit',
        performance_issue: 'Performa, lag, atau masalah halaman',
        privacy_permission: 'Kekhawatiran privasi atau izin',
        found_alternative: 'Menemukan alat lain',
        temporary_uninstall: 'Hapus sementara, mungkin pasang lagi nanti',
        other: 'Lainnya'
      }
    }
  };
  const text = translations[language] || translations['en-US'];
  const payload = JSON.stringify({ language, version, text }).replace(/</g, '\\u003c');
  return `<!doctype html>
<html lang="${escapeHtml(language)}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(text.title)}</title>
  <style>
    :root { color-scheme: light; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #17202a; background: #f5f7fb; }
    body { margin: 0; min-height: 100vh; display: grid; place-items: center; padding: 24px; box-sizing: border-box; }
    main { width: min(720px, 100%); background: #fff; border: 1px solid #dde3ee; border-radius: 8px; padding: 28px; box-shadow: 0 16px 40px rgba(23, 32, 42, 0.08); box-sizing: border-box; }
    h1 { margin: 0 0 8px; font-size: clamp(24px, 5vw, 34px); line-height: 1.15; }
    h2 { margin: 22px 0 12px; font-size: 18px; }
    p { margin: 0 0 16px; color: #5d6d7e; line-height: 1.55; }
    .reasons { display: grid; gap: 10px; margin: 0 0 18px; }
    label.reason { display: flex; gap: 10px; align-items: flex-start; padding: 10px 12px; border: 1px solid #d8e0eb; border-radius: 8px; cursor: pointer; }
    label.reason:has(input:checked) { border-color: #2f80ed; background: #f0f6ff; }
    input[type="checkbox"] { margin-top: 3px; }
    textarea, input[type="text"] { width: 100%; box-sizing: border-box; border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px 12px; font: inherit; }
    textarea { min-height: 110px; resize: vertical; }
    .field { display: grid; gap: 8px; margin-top: 16px; font-weight: 600; }
    .actions { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 22px; }
    button, .link { border: 0; border-radius: 8px; padding: 10px 16px; font: inherit; text-decoration: none; cursor: pointer; }
    button[type="submit"] { background: #1f6feb; color: white; }
    button[type="button"], .link { background: #eef2f7; color: #17202a; }
    button:disabled { opacity: 0.55; cursor: not-allowed; }
    .status { min-height: 24px; margin-top: 16px; font-weight: 600; color: #1b5e20; }
    .status.error { color: #b42318; }
    .success-links { display: none; gap: 10px; flex-wrap: wrap; margin-top: 12px; }
    .success-links.visible { display: flex; }
  </style>
</head>
<body>
  <main>
    <h1>${escapeHtml(text.title)}</h1>
    <p>${escapeHtml(text.privacy)}</p>
    <form id="survey">
      <h2>${escapeHtml(text.subtitle)}</h2>
      <div class="reasons" id="reasons"></div>
      <label class="field">${escapeHtml(text.message)}
        <textarea id="message" maxlength="${MAX_UNINSTALL_MESSAGE_LENGTH}"></textarea>
      </label>
      <label class="field">${escapeHtml(text.contact)}
        <input id="contact" type="text" maxlength="${MAX_CONTACT_LENGTH}" autocomplete="email">
      </label>
      <p>${escapeHtml(text.hint)}</p>
      <div class="actions">
        <button id="submit" type="submit">${escapeHtml(text.submit)}</button>
        <button id="skip" type="button">${escapeHtml(text.skip)}</button>
      </div>
      <div class="status" id="status" role="status" aria-live="polite"></div>
      <div class="success-links" id="successLinks">
        <a class="link" href="https://chromewebstore.google.com/" rel="noopener noreferrer">${escapeHtml(text.reopen)}</a>
        <a class="link" href="https://github.com/kscje/page-scroll-master" rel="noopener noreferrer">${escapeHtml(text.github)}</a>
      </div>
    </form>
  </main>
  <script>
    const SURVEY = ${payload};
    const reasonOrder = ${JSON.stringify(Array.from(UNINSTALL_REASONS))};
    const form = document.getElementById('survey');
    const reasons = document.getElementById('reasons');
    const status = document.getElementById('status');
    const links = document.getElementById('successLinks');
    const submit = document.getElementById('submit');
    reasonOrder.forEach((key) => {
      const label = document.createElement('label');
      label.className = 'reason';
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.name = 'reason';
      input.value = key;
      const span = document.createElement('span');
      span.textContent = SURVEY.text.reasons[key] || key;
      label.append(input, span);
      reasons.append(label);
    });
    document.getElementById('skip').addEventListener('click', () => {
      status.className = 'status';
      status.textContent = SURVEY.text.skipped;
      links.classList.remove('visible');
    });
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      status.className = 'status';
      status.textContent = '';
      const selected = Array.from(form.querySelectorAll('input[name="reason"]:checked')).map((input) => input.value);
      const message = document.getElementById('message').value.trim();
      const contact = document.getElementById('contact').value.trim();
      if (!selected.length && message.length < ${MIN_UNINSTALL_MESSAGE_LENGTH}) {
        status.className = 'status error';
        status.textContent = SURVEY.text.hint;
        return;
      }
      submit.disabled = true;
      try {
        const response = await fetch('/v1/uninstall-feedback', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            type: 'uninstall',
            reasons: selected,
            message,
            contact,
            extensionVersion: SURVEY.version,
            language: SURVEY.language,
            source: 'uninstall-survey',
            schemaVersion: 1
          })
        });
        if (!response.ok) throw new Error('submit_failed');
        status.className = 'status';
        status.textContent = SURVEY.text.success;
        links.classList.add('visible');
        form.reset();
      } catch {
        status.className = 'status error';
        status.textContent = SURVEY.text.error;
      } finally {
        submit.disabled = false;
      }
    });
  </script>
</body>
</html>`;
}

function matchesBytes(bytes, expected, offset = 0) {
  return expected.every((value, index) => bytes[offset + index] === value);
}

async function validateImage(file) {
  if (!(file instanceof File) || !Object.hasOwn(IMAGE_SIGNATURES, file.type) ||
      file.size <= 0 || file.size > MAX_IMAGE_BYTES) {
    return false;
  }
  const bytes = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  if (file.type === 'image/webp') {
    return matchesBytes(bytes, IMAGE_SIGNATURES[file.type][0], 0) &&
      matchesBytes(bytes, IMAGE_SIGNATURES[file.type][1], 8);
  }
  return matchesBytes(bytes, IMAGE_SIGNATURES[file.type][0]);
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[character]);
}

function toBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
  }
  return btoa(binary);
}

async function hashIp(ip, salt) {
  const bytes = new TextEncoder().encode(`${salt}:${ip}`);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map((value) => value.toString(16).padStart(2, '0'))
    .join('');
}

async function enforceRateLimit(request, env, now) {
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const ipHash = await hashIp(ip, env.IP_HASH_SALT);
  const hourBucket = now.toISOString().slice(0, 13);
  const result = await env.DB.prepare(`
    INSERT INTO feedback_rate_limits (ip_hash, hour_bucket, request_count, expires_at)
    VALUES (?, ?, 1, ?)
    ON CONFLICT(ip_hash, hour_bucket) DO UPDATE SET
      request_count = request_count + 1
    RETURNING request_count
  `).bind(
    ipHash,
    hourBucket,
    new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString()
  ).first();
  return Number(result && result.request_count) <= RATE_LIMIT_PER_HOUR;
}

async function writeLog(env, values) {
  await env.DB.prepare(`
    INSERT INTO feedback_logs (
      request_id, feedback_type, image_count, included_page_url, delivery_status,
      created_at, expires_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `).bind(
    values.requestId,
    values.type,
    values.imageCount,
    values.includedPageUrl ? 1 : 0,
    values.status,
    values.createdAt,
    values.expiresAt
  ).run();
}

async function writeUninstallLog(env, values) {
  await env.DB.prepare(`
    INSERT INTO uninstall_feedback_logs (
      request_id, reasons, reason_count, has_message, has_contact,
      extension_version, language, delivery_status, created_at, expires_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    values.requestId,
    values.reasons.join(','),
    values.reasons.length,
    values.hasMessage ? 1 : 0,
    values.hasContact ? 1 : 0,
    values.extensionVersion,
    values.language,
    values.status,
    values.createdAt,
    values.expiresAt
  ).run();
}

async function sendEmail(env, feedback) {
  const attachments = [];
  for (let index = 0; index < feedback.images.length; index++) {
    const image = feedback.images[index];
    const extension = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp'
    }[image.type];
    attachments.push({
      filename: `feedback-${index + 1}.${extension}`,
      content: toBase64(await image.arrayBuffer())
    });
  }

  const lines = [
    `Type: ${feedback.type}`,
    `Extension version: ${feedback.extensionVersion}`,
    `Language: ${feedback.language}`,
    `Contact: ${feedback.contact || 'not provided'}`,
    '',
    feedback.message
  ];
  const html = `
    <h2>Page Scroll Master feedback</h2>
    <p><strong>Type:</strong> ${escapeHtml(feedback.type)}</p>
    <p><strong>Extension version:</strong> ${escapeHtml(feedback.extensionVersion)}</p>
    <p><strong>Language:</strong> ${escapeHtml(feedback.language)}</p>
    <p><strong>Contact:</strong> ${escapeHtml(feedback.contact || 'not provided')}</p>
    <hr>
    <pre style="white-space:pre-wrap;font-family:system-ui,sans-serif">${escapeHtml(feedback.message)}</pre>
  `;
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${env.RESEND_API_KEY}`,
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      from: env.FEEDBACK_FROM_EMAIL,
      to: [env.FEEDBACK_TO_EMAIL],
      subject: `[Page Scroll Master] ${feedback.type} feedback`,
      text: lines.join('\n'),
      html,
      attachments
    })
  });
  return response.ok;
}

async function sendUninstallEmail(env, feedback) {
  const reasonLabels = feedback.reasons.map((reason) =>
    `${reason}: ${UNINSTALL_REASON_LABELS[reason] || reason}`
  );
  const lines = [
    'Type: uninstall',
    `Extension version: ${feedback.extensionVersion}`,
    `Language: ${feedback.language}`,
    `Contact: ${feedback.contact || 'not provided'}`,
    `Reasons: ${feedback.reasons.join(', ')}`,
    '',
    'Reason details:',
    ...reasonLabels,
    '',
    feedback.message || 'No additional details provided.'
  ];
  const html = `
    <h2>Page Scroll Master uninstall feedback</h2>
    <p><strong>Extension version:</strong> ${escapeHtml(feedback.extensionVersion)}</p>
    <p><strong>Language:</strong> ${escapeHtml(feedback.language)}</p>
    <p><strong>Contact:</strong> ${escapeHtml(feedback.contact || 'not provided')}</p>
    <p><strong>Reasons:</strong> ${escapeHtml(feedback.reasons.join(', '))}</p>
    <ul>${reasonLabels.map((reason) => `<li>${escapeHtml(reason)}</li>`).join('')}</ul>
    <hr>
    <pre style="white-space:pre-wrap;font-family:system-ui,sans-serif">${escapeHtml(feedback.message || 'No additional details provided.')}</pre>
  `;
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${env.RESEND_API_KEY}`,
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      from: env.FEEDBACK_FROM_EMAIL,
      to: [env.FEEDBACK_TO_EMAIL],
      subject: '[Page Scroll Master] uninstall feedback',
      text: lines.join('\n'),
      html
    })
  });
  return response.ok;
}

async function parseFeedback(request) {
  const form = await request.formData();
  const feedback = {
    type: normalizeText(form.get('type')),
    message: normalizeText(form.get('message')),
    contact: normalizeText(form.get('contact')),
    extensionVersion: normalizeText(form.get('extensionVersion')),
    language: normalizeText(form.get('language')),
    website: normalizeText(form.get('website')),
    images: form.getAll('images[]')
  };

  if (feedback.website) return { spam: true };
  if (!FEEDBACK_TYPES.has(feedback.type) ||
      feedback.message.length < MIN_MESSAGE_LENGTH ||
      feedback.message.length > MAX_MESSAGE_LENGTH ||
      feedback.contact.length > MAX_CONTACT_LENGTH ||
      /[\r\n]/.test(feedback.contact) ||
      !/^(?:\d{1,6}\.){2}\d{1,6}$/.test(feedback.extensionVersion) ||
      !LANGUAGE_CODES.has(feedback.language) ||
      feedback.images.length > MAX_IMAGES) {
    return { error: 'invalid_payload' };
  }
  for (const image of feedback.images) {
    if (!await validateImage(image)) return { error: 'invalid_image' };
  }
  return { feedback };
}

async function parseUninstallFeedback(request) {
  let payload;
  try {
    payload = await request.json();
  } catch {
    return { error: 'invalid_json' };
  }

  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return { error: 'invalid_payload' };
  }

  const reasons = Array.isArray(payload.reasons)
    ? Array.from(new Set(payload.reasons.map(normalizeText)))
    : [];
  const message = normalizeText(payload.message);
  const contact = normalizeText(payload.contact);
  const extensionVersion = normalizeText(payload.extensionVersion);
  const language = normalizeLanguageCode(payload.language);
  const source = normalizeText(payload.source);

  if (payload.type !== 'uninstall' ||
      payload.schemaVersion !== 1 ||
      source !== 'uninstall-survey' ||
      reasons.length > MAX_UNINSTALL_REASONS ||
      reasons.some((reason) => !UNINSTALL_REASONS.has(reason)) ||
      (!reasons.length && message.length < MIN_UNINSTALL_MESSAGE_LENGTH) ||
      message.length > MAX_UNINSTALL_MESSAGE_LENGTH ||
      contact.length > MAX_CONTACT_LENGTH ||
      /[\r\n]/.test(contact) ||
      !/^(?:\d{1,6}\.){2}\d{1,6}$/.test(extensionVersion)) {
    return { error: 'invalid_payload' };
  }

  return {
    feedback: {
      reasons,
      message,
      contact,
      extensionVersion,
      language
    }
  };
}

async function handleFeedback(request, env, origin) {
  const contentType = request.headers.get('content-type') || '';
  if (!contentType.toLowerCase().startsWith('multipart/form-data')) {
    return jsonResponse({ error: 'unsupported_media_type' }, 415, origin);
  }
  const declaredSize = Number(request.headers.get('content-length'));
  if (Number.isFinite(declaredSize) && declaredSize > MAX_REQUEST_BYTES) {
    return jsonResponse({ error: 'payload_too_large' }, 413, origin);
  }

  const now = new Date();
  if (!await enforceRateLimit(request, env, now)) {
    return jsonResponse({ error: 'rate_limited' }, 429, origin);
  }

  const parsed = await parseFeedback(request);
  if (parsed.spam) {
    return jsonResponse({ accepted: true }, 202, origin);
  }
  if (parsed.error) {
    return jsonResponse({ error: parsed.error }, 400, origin);
  }

  const requestId = crypto.randomUUID();
  const delivered = await sendEmail(env, parsed.feedback);
  const createdAt = now.toISOString();
  try {
    await writeLog(env, {
      requestId,
      type: parsed.feedback.type,
      imageCount: parsed.feedback.images.length,
      includedPageUrl: false,
      status: delivered ? 'sent' : 'failed',
      createdAt,
      expiresAt: new Date(now.getTime() + LOG_RETENTION_DAYS * 86400000).toISOString()
    });
  } catch {
    // A metadata logging failure must not cause a successfully delivered email to be resent.
  }
  if (!delivered) {
    return jsonResponse({ error: 'delivery_failed', requestId }, 502, origin);
  }
  return jsonResponse({ accepted: true, requestId }, 202, origin);
}

async function handleUninstallFeedback(request, env, origin) {
  const contentType = request.headers.get('content-type') || '';
  if (!contentType.toLowerCase().startsWith('application/json')) {
    return jsonResponse({ error: 'unsupported_media_type' }, 415, origin);
  }
  const declaredSize = Number(request.headers.get('content-length'));
  if (Number.isFinite(declaredSize) && declaredSize > MAX_UNINSTALL_REQUEST_BYTES) {
    return jsonResponse({ error: 'payload_too_large' }, 413, origin);
  }

  const now = new Date();
  if (!await enforceRateLimit(request, env, now)) {
    return jsonResponse({ error: 'rate_limited' }, 429, origin);
  }

  const parsed = await parseUninstallFeedback(request);
  if (parsed.error) {
    return jsonResponse({ error: parsed.error }, 400, origin);
  }

  const requestId = crypto.randomUUID();
  const delivered = await sendUninstallEmail(env, parsed.feedback);
  const createdAt = now.toISOString();
  try {
    await writeUninstallLog(env, {
      requestId,
      reasons: parsed.feedback.reasons,
      hasMessage: parsed.feedback.message.length > 0,
      hasContact: parsed.feedback.contact.length > 0,
      extensionVersion: parsed.feedback.extensionVersion,
      language: parsed.feedback.language,
      status: delivered ? 'sent' : 'failed',
      createdAt,
      expiresAt: new Date(now.getTime() + LOG_RETENTION_DAYS * 86400000).toISOString()
    });
  } catch {
    // A metadata logging failure must not cause a successfully delivered email to be resent.
  }
  if (!delivered) {
    return jsonResponse({ error: 'delivery_failed', requestId }, 502, origin);
  }
  return jsonResponse({ accepted: true, requestId }, 202, origin);
}

async function cleanup(env, now) {
  await env.DB.batch([
    env.DB.prepare('DELETE FROM feedback_rate_limits WHERE expires_at < ?').bind(now.toISOString()),
    env.DB.prepare('DELETE FROM feedback_logs WHERE expires_at < ?').bind(now.toISOString()),
    env.DB.prepare('DELETE FROM uninstall_feedback_logs WHERE expires_at < ?').bind(now.toISOString())
  ]);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get('origin') || '';
    if (url.pathname === '/uninstall') {
      if (request.method !== 'GET') {
        return jsonResponse({ error: 'method_not_allowed' }, 405, origin);
      }
      return htmlResponse(renderUninstallSurveyPage(request.url));
    }
    if (!['/v1/feedback', '/v1/uninstall-feedback'].includes(url.pathname)) {
      return jsonResponse({ error: 'not_found' }, 404, origin);
    }
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          ...responseHeaders(origin),
          'access-control-allow-methods': 'POST, OPTIONS',
          'access-control-allow-headers': 'content-type',
          'access-control-max-age': '86400'
        }
      });
    }
    if (request.method !== 'POST') {
      return jsonResponse({ error: 'method_not_allowed' }, 405, origin);
    }
    try {
      if (url.pathname === '/v1/uninstall-feedback') {
        return await handleUninstallFeedback(request, env, origin);
      }
      return await handleFeedback(request, env, origin);
    } catch {
      return jsonResponse({ error: 'internal_error' }, 500, origin);
    }
  },

  async scheduled(controller, env, ctx) {
    ctx.waitUntil(cleanup(env, new Date(controller.scheduledTime)));
  }
};
