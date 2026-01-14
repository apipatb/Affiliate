'use client'

import { Copy, Check } from 'lucide-react'
import { useState } from 'react'

export default function ImageExtractorPage() {
  const [copied, setCopied] = useState(false)

  const bookmarkletCode = `
javascript:(function(){
  const images = [];
  const videos = [];

  // Extract images
  document.querySelectorAll('img').forEach(img => {
    const src = img.src || img.dataset.src;
    if (src && src.includes('susercontent.com')) {
      const highRes = src.replace('_tn', '').replace(/\\.\\d+x\\d+\\./, '.');
      if (!images.includes(highRes)) images.push(highRes);
    }
  });

  // Extract videos
  document.querySelectorAll('video').forEach(vid => {
    const src = vid.src || vid.dataset.src;
    if (src) videos.push(src);
  });

  // Create result window
  const result = document.createElement('div');
  result.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:white;padding:30px;border-radius:12px;box-shadow:0 10px 40px rgba(0,0,0,0.3);z-index:999999;max-width:600px;max-height:80vh;overflow:auto;font-family:system-ui;';

  result.innerHTML = \`
    <div style="margin-bottom:20px;">
      <h2 style="margin:0 0 10px 0;color:#1a1a1a;font-size:24px;">🖼️ รูปภาพและวิดีโอ</h2>
      <button onclick="this.parentElement.parentElement.remove()" style="position:absolute;top:15px;right:15px;border:none;background:#f0f0f0;width:30px;height:30px;border-radius:50%;cursor:pointer;font-size:20px;">×</button>
    </div>

    <div style="margin-bottom:20px;">
      <div style="font-weight:600;margin-bottom:10px;color:#333;">📷 รูปภาพ (\${images.length})</div>
      \${images.map((url, i) => \`
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;padding:10px;background:#f8f9fa;border-radius:6px;">
          <img src="\${url}" style="width:60px;height:60px;object-fit:cover;border-radius:4px;">
          <input readonly value="\${url}" style="flex:1;padding:8px;border:1px solid #ddd;border-radius:4px;font-size:12px;">
          <button onclick="navigator.clipboard.writeText('\${url}');this.textContent='✓'" style="padding:8px 15px;background:#3b82f6;color:white;border:none;border-radius:4px;cursor:pointer;">Copy</button>
        </div>
      \`).join('')}
    </div>

    \${videos.length > 0 ? \`
      <div>
        <div style="font-weight:600;margin-bottom:10px;color:#333;">🎥 วิดีโอ (\${videos.length})</div>
        \${videos.map(url => \`
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;padding:10px;background:#f8f9fa;border-radius:6px;">
            <video src="\${url}" style="width:60px;height:60px;object-fit:cover;border-radius:4px;"></video>
            <input readonly value="\${url}" style="flex:1;padding:8px;border:1px solid #ddd;border-radius:4px;font-size:12px;">
            <button onclick="navigator.clipboard.writeText('\${url}');this.textContent='✓'" style="padding:8px 15px;background:#3b82f6;color:white;border:none;border-radius:4px;cursor:pointer;">Copy</button>
          </div>
        \`).join('')}
      </div>
    \` : ''}

    <div style="margin-top:20px;padding:15px;background:#e3f2fd;border-radius:6px;font-size:13px;color:#1976d2;">
      💡 คลิก Copy เพื่อคัดลอก URL แล้ววางใน CSV column "imageUrl"
    </div>
  \`;

  document.body.appendChild(result);
})();
`.trim()

  const copyBookmarklet = () => {
    navigator.clipboard.writeText(bookmarkletCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="py-8">
      <h1 className="text-3xl font-bold mb-8 text-black dark:text-white">🖼️ ดึงรูปภาพจาก Shopee</h1>

      {/* Instructions */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6 mb-8">
        <h2 className="text-lg font-bold text-blue-900 dark:text-blue-300 mb-4">
          📖 วิธีใช้งาน (3 ขั้นตอน)
        </h2>
        <ol className="space-y-3 text-blue-800 dark:text-blue-200">
          <li className="flex gap-3">
            <span className="font-bold">1.</span>
            <span>คัดลอก Bookmarklet ด้านล่าง (คลิกปุ่ม Copy)</span>
          </li>
          <li className="flex gap-3">
            <span className="font-bold">2.</span>
            <span>เปิดหน้าสินค้า Shopee ที่ต้องการดึงรูป</span>
          </li>
          <li className="flex gap-3">
            <span className="font-bold">3.</span>
            <span>
              วาง Code ใน <strong>Console</strong> (กด F12 → Console → วาง → Enter)
              <br />
              <span className="text-sm opacity-75">หรือสร้าง Bookmark แล้ววาง Code เป็น URL</span>
            </span>
          </li>
        </ol>
      </div>

      {/* Bookmarklet Code */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-black dark:text-white">📋 Bookmarklet Code</h2>
          <button
            onClick={copyBookmarklet}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                คัดลอกแล้ว!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy Code
              </>
            )}
          </button>
        </div>
        <pre className="bg-slate-900 dark:bg-slate-950 text-green-400 p-4 rounded-lg overflow-x-auto text-sm font-mono">
          {bookmarkletCode}
        </pre>
      </div>

      {/* Video Tutorial */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <h2 className="text-lg font-bold text-black dark:text-white mb-4">🎥 วิธีใช้แบบละเอียด</h2>
        <div className="space-y-4 text-slate-700 dark:text-slate-300">
          <div>
            <h3 className="font-semibold text-black dark:text-white mb-2">วิธีที่ 1: ใช้ผ่าน Console (แนะนำ)</h3>
            <ol className="list-decimal list-inside space-y-2 ml-2">
              <li>เปิดหน้าสินค้า Shopee ที่ต้องการ</li>
              <li>กด <kbd className="px-2 py-1 bg-slate-200 dark:bg-slate-700 rounded">F12</kbd> เพื่อเปิด DevTools</li>
              <li>ไปที่แท็บ <strong>Console</strong></li>
              <li>วาง Code ที่คัดลอกไว้</li>
              <li>กด <kbd className="px-2 py-1 bg-slate-200 dark:bg-slate-700 rounded">Enter</kbd></li>
              <li>จะมีหน้าต่างโผล่มาแสดงรูปทั้งหมด</li>
              <li>คลิก <strong>Copy</strong> ที่รูปที่ต้องการ</li>
              <li>วางลงใน CSV column <code className="bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded">imageUrl</code></li>
            </ol>
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
            <h3 className="font-semibold text-black dark:text-white mb-2">วิธีที่ 2: สร้าง Bookmark (ใช้ซ้ำได้)</h3>
            <ol className="list-decimal list-inside space-y-2 ml-2">
              <li>คัดลอก Code ด้านบน</li>
              <li>สร้าง Bookmark ใหม่ใน browser</li>
              <li>วาง Code ลงใน URL ของ Bookmark</li>
              <li>ตั้งชื่อเช่น "ดึงรูป Shopee"</li>
              <li>เมื่ออยู่ที่หน้าสินค้า คลิก Bookmark นั้นได้เลย</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Note */}
      <div className="mt-8 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-6">
        <h3 className="font-bold text-amber-900 dark:text-amber-300 mb-2">📌 หมายเหตุ</h3>
        <ul className="space-y-2 text-amber-800 dark:text-amber-200 text-sm">
          <li>• Code นี้ปลอดภัย 100% ทำงานเฉพาะหน้าเว็บของคุณเท่านั้น</li>
          <li>• ไม่มีการส่งข้อมูลไปที่ไหน ทำงานแบบ offline</li>
          <li>• รองรับทั้งรูปภาพและวิดีโอ</li>
          <li>• ได้รูปความละเอียดสูงสุด (High Resolution)</li>
        </ul>
      </div>
    </div>
  )
}
