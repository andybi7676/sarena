import React from 'react';

function Track1() {
  return (
    <div className="flex w-full min-h-dvh divide-x divide-slate-600">
      <div className="w-2/3">
        {/* 使用 iframe 嵌入頁面 */}
        <iframe
          src="https://dynamic-superb.github.io/docs/call-for-tasks"
          title="Dynamic Superb Call for Tasks"
          width="100%"
          height="100%"
          className="h-screen"
          allowFullScreen
        ></iframe>
      </div>
      <div className="w-1/3 flex items-center justify-center">
        <a
          href="https://dynamic-superb.github.io/docs/call-for-tasks"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 hover:underline"
        >
          Visit Dynamic Superb Call for Tasks
        </a>
      </div>
    </div>
  );
}

export default Track1;
