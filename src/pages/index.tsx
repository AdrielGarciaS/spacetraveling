import { useEffect, useState } from 'react';
import { GetStaticProps } from 'next';
import Link from 'next/link';
import Prismic from '@prismicio/client';
import { FiCalendar, FiUser } from 'react-icons/fi';
import { Document } from '@prismicio/client/types/documents';
import Header from '../components/Header';

import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';
import { formatDate } from '../utils/format';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

function formatPrismicPost(post: Document): Post {
  const { uid, first_publication_date, data } = post;

  return {
    uid,
    first_publication_date: formatDate(new Date(first_publication_date)),
    data,
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home(props: HomeProps): JSX.Element {
  const { postsPagination } = props;
  const { results, next_page } = postsPagination;

  const [posts, setPosts] = useState<Post[]>([]);
  const [nextPage, setNextPage] = useState<string | null>(next_page);

  const hasMore = Boolean(nextPage);

  useEffect(() => {
    const postsFormatted = results.map(formatPrismicPost);

    setPosts(postsFormatted);
  }, [results]);

  async function handleLoadMore(): Promise<void> {
    if (!nextPage) return;

    const response = await fetch(nextPage);
    const data = await response.json();

    const formattedPosts = data.results.map(formatPrismicPost);

    setPosts([...posts, ...formattedPosts]);
    setNextPage(data.next_page);
  }

  return (
    <div className={`${styles.container} ${commonStyles.contentCenter}`}>
      <Header />
      <main>
        <ul>
          {posts.map(post => (
            <li key={post.uid} className={styles.post}>
              <Link href={`post/${post.uid}`}>
                <a>
                  <strong>{post.data.title}</strong>
                  <p>{post.data.subtitle}</p>
                  <div>
                    <time>
                      <FiCalendar />
                      {post.first_publication_date}
                    </time>
                    <span>
                      <FiUser />
                      {post.data.author}
                    </span>
                  </div>
                </a>
              </Link>
            </li>
          ))}
        </ul>

        {hasMore && (
          <button
            className={styles.loadMore}
            type="button"
            onClick={handleLoadMore}
          >
            Carregar mais posts
          </button>
        )}
      </main>
    </div>
  );
}

export const getStaticProps: GetStaticProps<HomeProps> = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      fetch: ['posts.title', 'posts.subtitle', 'posts.author'],
      pageSize: 1,
    }
  );

  return {
    props: {
      postsPagination: {
        results: postsResponse.results,
        next_page: postsResponse.next_page,
      },
    },
  };
};
