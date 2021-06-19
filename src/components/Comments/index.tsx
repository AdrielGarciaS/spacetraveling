/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable consistent-return */
import { useEffect } from 'react';

const commentNodeId = 'comments';

export const Comments = (): JSX.Element => {
  useEffect(() => {
    const scriptParentNode = document.getElementById(commentNodeId);
    if (!scriptParentNode) return;

    const script = document.createElement('script');
    script.src = 'https://utteranc.es/client.js';
    script.async = true;
    script.setAttribute('repo', process.env.NEXT_PUBLIC_GITHUB_REPOSITORY);
    script.setAttribute('issue-term', 'pathname');
    script.setAttribute('label', process.env.NEXT_PUBLIC_GITHUB_LABEL);
    script.setAttribute('theme', 'github-dark');
    script.setAttribute('crossorigin', 'anonymous');

    scriptParentNode.appendChild(script);

    return () => {
      scriptParentNode.removeChild(scriptParentNode.firstChild);
    };
  }, [commentNodeId]);

  return <div id={commentNodeId} />;
};
