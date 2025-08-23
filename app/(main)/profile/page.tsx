import type { Metadata } from 'next';
import ProfileCard from '@/components/profile-card';
import SectionHeader from '@/components/section-header';
import SkillsSection from '../../../components/skills-section';
import TimelineDetailed from '../../../components/timeline-detailed';
import Accordion from '@/components/accordion';
import PrimaryButton from '@/components/primary-button';

export default function Profile() {
  const hobbies = [
    {
      title: 'コーヒー',
      body: 'おいしいコーヒーを飲めるカフェを探したり、様々な淹れ方や豆を試したりしています。',
    },
    {
      title: 'ドライブ',
      body: '気分転換にドライブに行き、美しい景色を眺めにいったり、知らない街を探索したりしています。',
    },
    {
      title: '旅行',
      body: '主に国内旅行に行きます。東北地方の太平洋側、山陰地方、四国地方の太平洋側、九州南部にはまだいけていません。',
    },
  ];

  const faqs = [
    {
      q: '仕事の依頼は受け付けていますか？',
      a: 'はい。個人・チーム問わずご相談いただければ対応いたします。まずはお問い合わせください。',
    },
    {
      q: '使用可能な制作ツールは？',
      a: 'Figma, Illustrator, VSCode, Next.js, Tailwind CSS などを主に使用しています。',
    },
    {
      q: '納期や料金感はどのように決めていますか？',
      a: '内容の難易度や工数に応じて見積もりを提示します。まずはヒアリングを行い、大まかなスケジュール感を共有します。',
    },
  ];

  return (
    <div className="text-neutral-100 flex flex-col items-center gap-16 overflow-x-hidden">
      <div
        className="w-full h-screen bg-neutral-900/10 fixed top-0 left-0 backdrop-blur-sm z-40 flex items-center  justify-center"
        id="まだ未完成。雰囲気だけ楽しんでくれるなら消してもいい。"
      >
        <div className="flex flex-col items-center justify-center gap-8">
          <p className="text-5xl font-medium text-amber-200/80">作業中</p>
          <p>またのご訪問をお待ちしています。</p>
          <PrimaryButton href="/">ホームへ戻る</PrimaryButton>
        </div>
      </div>
      {/* セクション1: プロフィールカード + 簡単な自己紹介 */}
      <section className="w-screen h-screen flex flex-col justify-center items-center px-4 sm:px-12 xl:px-48 2xl:max-w-[1500px] pt-28">
        <div className="w-full pb-8 md:pb-0">
          <SectionHeader title="Profile" subtitle="自己紹介" />
        </div>

        <div className="w-full flex flex-col md:flex-row items-center justify-center gap-4 2xl:gap-10">
          <div className="w-full md:w-96 flex flex-col gap-6 items-center md:items-start">
            <ProfileCard />
          </div>

          <div className="w-full md:flex-1 text-sm text-neutral-300 tracking-wider leading-relaxed flex flex-col justify-center">
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
            <div className="flex gap-3 mt-8">
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
            subtitle="デザインと技術への情熱"
          />
          <div className="mt-6 text-neutral-200 text-sm leading-relaxed">
            <p className="mb-4">
              幼少期に物を作る楽しさに触れたことがきっかけで、表現と仕組みの両方に興味を持ちました。高校で触れたデザインと、独学で深めたコーディングは私にとって互いを高め合う存在です。
            </p>
            <p className="mb-4">
              制作では「使いやすさ」を最優先に、感情に訴えるビジュアルや操作の滑らかさにもこだわります。常にユーザー視点での改善を続け、技術でデザインを支えることに情熱を注いでいます。
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
                <h3 className="text-sm font-medium text-neutral-100 mb-2">
                  {hobby.title}
                </h3>
                <p className="text-xs text-neutral-400">{hobby.body}</p>
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
