function drawArrow(ctx, size, bgColor, iconColor) {
  const center = size / 2;
  const radius = size * 0.4;

  ctx.fillStyle = bgColor;
  ctx.beginPath();
  ctx.arc(center, center, radius, 0, 2 * Math.PI);
  ctx.fill();

  ctx.fillStyle = iconColor;
  ctx.beginPath();
  ctx.moveTo(center, center - radius * 0.5);
  ctx.lineTo(center - radius * 0.3, center - radius * 0.2);
  ctx.lineTo(center + radius * 0.3, center - radius * 0.2);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(center, center + radius * 0.5);
  ctx.lineTo(center - radius * 0.3, center + radius * 0.2);
  ctx.lineTo(center + radius * 0.3, center + radius * 0.2);
  ctx.closePath();
  ctx.fill();
}

function drawScroll(ctx, size, bgColor, iconColor) {
  const center = size / 2;
  const radius = size * 0.4;

  ctx.fillStyle = bgColor;
  ctx.beginPath();
  ctx.arc(center, center, radius, 0, 2 * Math.PI);
  ctx.fill();

  ctx.strokeStyle = iconColor;
  ctx.lineWidth = Math.max(1, size * 0.08);
  ctx.beginPath();
  ctx.moveTo(center, center - radius * 0.6);
  ctx.lineTo(center, center + radius * 0.6);
  ctx.stroke();

  ctx.fillStyle = iconColor;
  ctx.fillRect(center - radius * 0.15, center - radius * 0.2, radius * 0.3, radius * 0.4);
}

function drawCircle(ctx, size, bgColor, iconColor) {
  const center = size / 2;
  const radius = size * 0.4;

  ctx.fillStyle = bgColor;
  ctx.beginPath();
  ctx.arc(center, center, radius, 0, 2 * Math.PI);
  ctx.fill();

  ctx.fillStyle = iconColor;
  ctx.beginPath();
  ctx.arc(center, center, radius * 0.5, 0, 2 * Math.PI);
  ctx.fill();
}

function drawSquare(ctx, size, bgColor, iconColor) {
  const padding = size * 0.15;
  const rectSize = size - padding * 2;

  ctx.fillStyle = bgColor;
  ctx.fillRect(padding, padding, rectSize, rectSize);

  ctx.fillStyle = iconColor;
  const innerPadding = size * 0.3;
  const innerSize = size - innerPadding * 2;
  ctx.fillRect(innerPadding, innerPadding, innerSize, innerSize);
}

function updateIcons() {
  const bgColor = document.getElementById('bgColor').value;
  const iconColor = document.getElementById('iconColor').value;
  const iconStyle = document.getElementById('iconStyle').value;
  const sizes = [16, 32, 48, 128];

  sizes.forEach((size) => {
    const canvas = document.getElementById(`canvas${size}`);
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, size, size);

    switch (iconStyle) {
      case 'scroll':
        drawScroll(ctx, size, bgColor, iconColor);
        break;
      case 'circle':
        drawCircle(ctx, size, bgColor, iconColor);
        break;
      case 'square':
        drawSquare(ctx, size, bgColor, iconColor);
        break;
      case 'arrow':
      default:
        drawArrow(ctx, size, bgColor, iconColor);
        break;
    }
  });
}

function downloadIcon(size) {
  const canvas = document.getElementById(`canvas${size}`);
  const link = document.createElement('a');
  link.download = `icon${size}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

function downloadAll() {
  const sizes = [16, 32, 48, 128];
  let delay = 0;

  sizes.forEach((size) => {
    setTimeout(() => {
      downloadIcon(size);
    }, delay);
    delay += 200;
  });
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-download-size]').forEach((button) => {
    button.addEventListener('click', () => {
      downloadIcon(Number(button.dataset.downloadSize));
    });
  });

  document.getElementById('updateIconsButton').addEventListener('click', updateIcons);
  document.getElementById('downloadAllButton').addEventListener('click', downloadAll);
  updateIcons();
});
