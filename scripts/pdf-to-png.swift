// Convierte los PDF generados por og-image.mjs a PNG en su tamaño exacto (1 punto = 1 píxel) y borra los PDF.
import PDFKit
import AppKit
for nombre in ["public/og", "public/apple-touch-icon"] {
  let doc = PDFDocument(url: URL(fileURLWithPath: nombre + ".pdf"))!
  let page = doc.page(at: 0)!
  let r = page.bounds(for: .mediaBox)
  let rep = NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: Int(r.width), pixelsHigh: Int(r.height), bitsPerSample: 8, samplesPerPixel: 4, hasAlpha: true, isPlanar: false, colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0)!
  NSGraphicsContext.saveGraphicsState()
  NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: rep)
  page.draw(with: .mediaBox, to: NSGraphicsContext.current!.cgContext)
  NSGraphicsContext.restoreGraphicsState()
  try! rep.representation(using: .png, properties: [:])!.write(to: URL(fileURLWithPath: nombre + ".png"))
  try? FileManager.default.removeItem(atPath: nombre + ".pdf")
  print(nombre + ".png", Int(r.width), "x", Int(r.height))
}
