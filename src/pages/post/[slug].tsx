/* eslint-disable react/no-danger */
import { GetStaticPaths, GetStaticProps } from 'next';
import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';
import { RichText } from 'prismic-dom';
import Prismic from '@prismicio/client';

import { useRouter } from 'next/router';
import Header from '../../components/Header';

import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import { formatDate } from '../../utils/format';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: string;
    }[];
  };
}

interface PostProps {
  post?: Post;
}

export default function Post(props: PostProps): JSX.Element {
  const { post } = props;

  const router = useRouter();

  if (router.isFallback) return <p>Carregando ...</p>;

  return (
    <div className={styles.container}>
      <div className={commonStyles.contentCenter}>
        <Header />
      </div>

      <main className={styles.content}>
        <img src={post?.data.banner.url} alt="Banner" />

        <article className={commonStyles.contentCenter}>
          <section className={styles.info}>
            <h1>{post?.data.title}</h1>

            <div>
              <time>
                <FiCalendar size="1.2rem" />
                {post?.first_publication_date}
              </time>
              <span>
                <FiUser size="1.2rem" />
                {post?.data.author}
              </span>
              <span>
                <FiClock size="1.2rem" />4 min
              </span>
            </div>
          </section>

          {post?.data.content.map(content => (
            <div key={content.heading} className={styles.post}>
              <h2>{content.heading}</h2>
              <div dangerouslySetInnerHTML={{ __html: content.body }} />
            </div>
          ))}
        </article>
      </main>
    </div>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      fetch: ['posts.uid'],
      pageSize: 2,
    }
  );

  const paths = posts.results.map(post => ({ params: { slug: post.uid } }));

  return {
    fallback: true,
    paths,
  };
};

export const getStaticProps: GetStaticProps<PostProps> = async ({ params }) => {
  const { slug } = params;

  const prismic = getPrismicClient();
  const response = await prismic.getByUID('posts', String(slug), {});

  const contentFormatted = response.data.content.map(content => {
    return {
      heading: content.heading,
      body: RichText.asHtml(content.body),
    };
  });

  const post = {
    ...response,
    first_publication_date: formatDate(
      new Date(response.first_publication_date)
    ),
    data: {
      ...response.data,
      content: contentFormatted,
    },
  };

  return {
    props: { post },
  };
};
