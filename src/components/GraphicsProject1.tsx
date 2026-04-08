"use client";

export default function GraphicsProject1() {
  const scale = 1;
  const iframeWidth = 600;
  const iframeHeight = 600;

  return (
    <div style={{ 
      width: iframeWidth * scale,
      height: iframeHeight * scale,
    }}>
      <iframe
        src="/webgl/graphics_project1/index.html"
        scrolling="no"
        style={{
          width: iframeWidth,
          height: iframeHeight,
          transformOrigin: "top left",
          transform: `scale(${scale})`,
        }}
      />
    </div>
  );
}