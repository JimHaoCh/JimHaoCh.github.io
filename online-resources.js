(() => {
  const buttons = document.querySelectorAll('.resource-download-chunked');
  if (!buttons.length) return;

  async function fetchChunk(url) {
    const response = await fetch(url, {cache: 'no-store'});
    if (!response.ok) throw new Error('Download failed: ' + response.status);
    return response.arrayBuffer();
  }

  buttons.forEach((button) => {
    button.addEventListener('click', async () => {
      const urls = (button.dataset.chunks || '').split('|').filter(Boolean);
      const filename = button.dataset.filename || 'template.pptx';
      if (!urls.length) return;

      const original = button.innerHTML;
      button.disabled = true;
      button.innerHTML = '<span>準備下載中…<small lang="en">Preparing download…</small></span><span aria-hidden="true">…</span>';

      try {
        const buffers = [];
        for (const url of urls) buffers.push(await fetchChunk(url));
        const blob = new Blob(buffers, {type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation'});
        const objectUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = objectUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(objectUrl), 30000);
      } catch (error) {
        console.error(error);
        alert('下載暫時失敗，請重新整理頁面後再試一次。\nDownload failed. Please refresh the page and try again.');
      } finally {
        button.disabled = false;
        button.innerHTML = original;
      }
    });
  });
})();
