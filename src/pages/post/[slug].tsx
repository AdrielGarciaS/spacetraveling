/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react/no-danger */
import { GetStaticPaths, GetStaticProps } from 'next';
import { useEffect, useState } from 'react';
import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';
import { RichText } from 'prismic-dom';
import Prismic from '@prismicio/client';

import { useRouter } from 'next/router';
import Header from '../../components/Header';

import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import { formatDate } from '../../utils/format';
import styles from './post.module.scss';
import { Comments } from '../../components/Comments';

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
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostFormatted {
  first_publication_date: string | null;
  readingTime: string;
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

  const [data, setData] = useState<PostFormatted | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!post) return;

    const contentFormatted = post.data.content.map(content => {
      return {
        heading: content.heading,
        body: RichText.asHtml(content.body),
      };
    });

    const totalWords = post.data.content.reduce((acc, curr) => {
      const bodyWordsQuantity = curr.body.reduce((bodyAcc, bodyCurr) => {
        const words = bodyCurr.text.split(/\s/);
        return bodyAcc + words.length;
      }, 0);
      return acc + bodyWordsQuantity;
    }, 0);

    const readingTime = Math.ceil(totalWords / 200);

    const postFormatted = {
      ...post,
      first_publication_date: formatDate(new Date(post.first_publication_date)),
      readingTime: `${readingTime} min`,
      data: {
        ...post.data,
        content: contentFormatted,
      },
    };

    setData(postFormatted);
  }, []);

  if (router.isFallback) return <div>Carregando...</div>;

  return (
    <div className={styles.container}>
      <div className={commonStyles.contentCenter}>
        <Header />
      </div>

      <main className={styles.content}>
        <img src={data?.data.banner.url} alt="Banner" />

        <article
          className={`${commonStyles.contentCenter} ${styles.postContainer}`}
        >
          <section className={styles.info}>
            <h1>{data?.data.title}</h1>

            <div>
              <time>
                <FiCalendar size="1.2rem" />
                {data?.first_publication_date}
              </time>
              <span>
                <FiUser size="1.2rem" />
                {data?.data.author}
              </span>
              <span>
                <FiClock size="1.2rem" />
                {data?.readingTime}
              </span>
            </div>
          </section>

          {data?.data.content.map(content => (
            <div key={content.heading} className={styles.post}>
              <h2>{content.heading}</h2>
              <div dangerouslySetInnerHTML={{ __html: content.body }} />
            </div>
          ))}
        </article>

        <Comments />
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
      pageSize: 0,
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

  return {
    props: { post: response },
  };
};
