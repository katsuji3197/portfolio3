import type { Metadata } from 'next';
import ProfileCard from '@/components/profile-card';
import SectionHeader from '@/components/section-header';
import SkillsSection from '../../../components/skills-section';
import TimelineDetailed from '../../../components/timeline-detailed';
import Accordion from '@/components/accordion';
import PrimaryButton from '@/components/primary-button';
import HobbySwiper from '@/components/hobby-swiper';

export default function Profile() {
  const hobbies = [
    {
      title: 'コーヒー',
      body: 'おいしいコーヒーを飲めるカフェを探したり、様々な淹れ方や豆を試したりしています。',
      images: [
        '/img/hobby/coffee/coffee1.webp',
        '/img/hobby/coffee/coffee2.webp',
        '/img/hobby/coffee/coffee3.webp',
        '/img/hobby/coffee/coffee4.webp',
        '/img/hobby/coffee/coffee5.webp',
        '/img/hobby/coffee/coffee6.webp',
        '/img/hobby/coffee/coffee7.webp',
      ],
    },
    {
      title: 'ドライブ',
      body: '気分転換にドライブに行き、美しい景色を眺めにいったり、知らない街を探索したりしています。',
      images: [
        '/img/hobby/drive/drive1.webp',
        '/img/hobby/drive/drive2.webp',
        '/img/hobby/drive/drive3.webp',
        '/img/hobby/drive/drive4.webp',
      ],
    },
    {
      title: '旅行',
      body: '主に国内旅行に行きます。東北地方の太平洋側、山陰地方、四国地方の太平洋側、九州南部が未踏破のためいずれも行きたいです。',
      images: [
        '/img/hobby/travel/travel1.webp',
        '/img/hobby/travel/travel2.webp',
        '/img/hobby/travel/travel3.webp',
        '/img/hobby/travel/travel4.webp',
        '/img/hobby/travel/travel5.webp',
        '/img/hobby/travel/travel6.webp',
        '/img/hobby/travel/travel7.webp',
      ],
    },
  ];

  const faqs = [
    {
      q: '何ができるの？',
      a: 'HTML/CSSを使ったウェブサイトの制作、Next.jsを使ったフロントエンド開発、簡単な動画編集やデザイン作成などができます。',
    },
    {
      q: 'デザインって何だと思う？',
      a: '私の中では、ただ美しいものを作るという意味ではなく、人に寄り添い、さまざまな課題を解決するための手段として捉えています。',
    },
  ];

  return (
    <div className="text-neutral-100 flex flex-col items-center gap-16 overflow-x-hidden">
      {/* <div
        className="w-full h-screen bg-neutral-900/10 fixed top-0 left-0 backdrop-blur-sm z-40 flex items-center  justify-center"
        id="まだ未完成。雰囲気だけ楽しんでくれるなら消してもいい。"
      >
        <div className="flex flex-col items-center justify-center gap-8">
          <p className="text-5xl font-medium text-amber-200/80">作業中</p>
          <p>またのご訪問をお待ちしています。</p>
          <PrimaryButton href="/">ホームへ戻る</PrimaryButton>
        </div>
      </div> */}
      {/* セクション1: プロフィールカード + 簡単な自己紹介 */}
      <section className="w-screen flex flex-col justify-center items-center px-4 sm:px-12 xl:px-48 2xl:max-w-[1500px] pt-40">
        <div className="w-full pb-8 md:pb-0">
          <SectionHeader title="Profile" subtitle="自己紹介" />
        </div>

        <div className="w-full flex flex-col md:flex-row items-center justify-center gap-4 2xl:gap-10">
          <div className="w-full md:w-96 flex flex-col gap-6 items-center md:items-start">
            <ProfileCard />
          </div>

          <div className="w-full md:flex-1 text-sm md:text-base text-neutral-300 tracking-wider leading-relaxed flex flex-col justify-center">
            <p className="mb-4">
              2003年生まれ。石川県珠洲市出身、金沢市育ちです。UIデザインとフロントエンド開発を主軸に活動しています。
            </p>
            <p>
              飾りすぎない、わかりやすさとカッコよさの両立したデザインが好きです。
            </p>
            <p>
              製作を進める際は、使いやすさを第一に考えつつ、要望に合わせた雰囲気が出せるよう努めています。
            </p>
            <br />
            <p>
              技術もデザインも紙一重。技術はデザインであり、デザインは技術です。
            </p>
            <p>
              どちらも人に寄り添い、悩みや様々な問題を解決することも、感動を与えることもできます。
            </p>
            <p>
              こういった点で、両者に大きな違いはありません。このような考えを持っています。
            </p>
            <p>そのため私は、両者の境界を持たないようにしています。</p>
            <br />
            <p>
              まだまだ経験が浅いため、様々な経験を積みながら、さらなるスキルを磨いていきたいと思っています。
            </p>
            <br />
            <p>何か私にできることがありましたら、お気軽にご相談ください。</p>
            <div className="flex gap-6 mt-8">
              <PrimaryButton href="/contact">お問い合わせ</PrimaryButton>
              <PrimaryButton href="/projects">制作物を見る</PrimaryButton>
            </div>
          </div>
        </div>
      </section>

      {/* セクション2: デザインと技術に興味を持ったきっかけ */}
      <section className="w-screen px-4 sm:px-12 xl:px-48 2xl:max-w-[1500px]">
        <div className="w-full py-12">
          <SectionHeader
            title="Why I design & build"
            subtitle="デザインと技術の出会い"
          />
          <div className="mt-6 text-neutral-200 text-sm md:text-base leading-relaxed tracking-wider">
            <p className="mb-4">
              幼少期から手を動かして何かを創り上げることが好きで、よくブロックや積み木などのおもちゃで遊んでいました。
            </p>
            <p className="mb-4">
              その後、父親が触れているパソコンに興味を持ち、パソコンの操作に関する知識をつけると同時に、そこで動いているソフトウェアを作ってみたいという気持ちが芽生えてきました。
            </p>
            <p className="mb-4">
              小学校では、授業やクラブ活動でパワーポイントなどのツールに触る機会があり、視覚的に様々なことを表現できることを学び、積極的に活用するようになりました。
            </p>
            <p className="mb-4">
              中学校ではテックキャンプに参加し、HTMLやCSSと出会い、ウェブサイトの制作方法を学びました。
            </p>
            <p className="mb-4">
              高校は工業高校に進学し、授業や部活で気の合う仲間たちと共に技術的な知見を深めていきました。
              <br />
              また、クラス内で開催された修学旅行動画コンペの際に動画製作の学習をしているタイミングでデザイン技法と出会いました。
            </p>
            <p className="mb-4">
              大学でもさまざまな出会いがありました。授業や課外活動でFigmaやAdobeツール、Next.jsやGitHubなど次々と新しいツールや技術を使うようになり、今まで好きだったことが自然と結びついていきました。
            </p>
          </div>
        </div>
      </section>

      {/* セクション3: スキル */}
      <section className="w-screen px-4 sm:px-12 xl:px-48 2xl:max-w-[1500px]">
        <div className="w-full py-12">
          <SectionHeader title="Skills" subtitle="得意分野と自信の可視化" />
          <div className="mt-6">
            <SkillsSection />
          </div>
        </div>
      </section>

      {/* セクション4: 詳細タイムライン */}
      <section className="w-screen px-4 sm:px-12 xl:px-48 2xl:max-w-[1500px]">
        <div className="w-full py-12">
          <SectionHeader title="Timeline" subtitle="これまでの遍歴" />
          <div className="mt-6">
            <TimelineDetailed />
          </div>
        </div>
      </section>

      {/* セクション5: 趣味 */}
      <section className="w-screen px-4 sm:px-12 xl:px-48 2xl:max-w-[1500px]">
        <div className="w-full py-12">
          <SectionHeader title="Hobbies" subtitle="趣味" />
          <div className="mt-6 text-neutral-200 grid grid-cols-1 md:grid-cols-3 gap-6">
            {hobbies.map(hobby => (
              <div
                key={hobby.title}
                className="bg-neutral-900/10 p-4 rounded-lg border border-neutral-700"
              >
                {hobby.images && hobby.images.length > 0 && (
                  <HobbySwiper images={hobby.images} title={hobby.title} />
                )}
                <h3 className="text-sm font-medium text-neutral-100 mb-2">
                  {hobby.title}
                </h3>
                <p className="text-xs md:text-sm text-neutral-400">
                  {hobby.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* セクション6: FAQ (アコーディオン) */}
      <section className="w-screen px-4 sm:px-12 xl:px-48 2xl:max-w-[1500px]">
        <div className="w-full py-12">
          <SectionHeader title="FAQ" subtitle="よくある質問" />
          <div className="mt-6 flex flex-col gap-4">
            {faqs.map(item => (
              <Accordion key={item.q} title={item.q}>
                <p className="text-sm text-neutral-300">{item.a}</p>
              </Accordion>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export const metadata: Metadata = {
  title: 'Profile — N.Motoki',
  description: '中辻基希（NAKATSUJI Motoki）の経歴・スキル・活動について。',
};
