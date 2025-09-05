import type { Metadata } from 'next';
import DNAHelix from '@/components/dna-helix';
import ScrollButton from '@/components/scroll-button';
import ProjectsCarousel from '@/components/projects-carousel';
import ProjectsCarouselClient from '@/components/projects-carousel-client';
import { getProjects } from '@/lib/microcms';
import TypingText from '@/components/typing-text';
import PrimaryButton from '@/components/primary-button';
import ProfileCard from '../../components/profile-card';
import ProfileTabs from '@/components/profile-tabs';
import SectionHeader from '@/components/section-header';

export default async function Home() {
  const projects: any = [];

  return (
    <div className="text-neutral-200 has-custom-scrollbar">
      <div className="min-h-[200px] md:min-h-[400px] h-screen relative flex flex-col justify-center pl-4 sm:pl-24 xl:pl-48">
        <div className="pb-12 md:pb-0 flex flex-col items-start justify-center gap-6">
          <h1 className="text-2xl md:text-4xl font-bold leading-12 h-24">
            <TypingText
              lines={['Weaving a Kinder', 'Digital Universe.']}
              speedMs={20}
              startDelayMs={150}
              showCursor={false}
            />
          </h1>
          <h2 className="text-sm md:text-lg font-medium leading-12 text-neutral-300 h-8">
            <TypingText
              lines={['The portfolio of NAKATSUJI Motoki.']}
              speedMs={10}
              startDelayMs={1100}
              showCursor={false}
            />
          </h2>
          <div className="text-xs md:text-base pt-4 flex flex-col text-neutral-200 items-start justify-center gap-2 opacity-80 shadow-lg tracking-wider sm:p-4 p-0 sm:bg-neutral-800/40 sm:backdrop-blur-xl">
            <p>世界を織りなす、二つの糸。</p>
            <p>1つ、心地よさを求めるデザイン。</p>
            <p>2つ、それを現実にするテクノロジー。</p>
            <p>私が紡ぐのは、すべての人のためのデジタルの未来です。</p>
          </div>
        </div>

        <div className="w-full h-[120vh] sm:h-[100vh] md:h-[120vh] fixed -z-10 left-0 top-[calc(50vh)] sm:top-[calc(50vh)] xl:top-[calc(50vh)] -translate-y-1/2 opacity-70 [@media(min-resolution:2dppx)]:top-[calc(0vh)] [@media(min-resolution:2dppx)]:-translate-y-[60%]">
          <DNAHelix
            className="w-full h-full"
            radius={3.2}
            height={1300}
            turns={80}
            particleSize={0.112}
            rotationSpeed={-0.4}
          />
        </div>

        <ScrollButton className="absolute md:bottom-6 bottom-24 left-1/2 -translate-x-1/2">
          <div className="flex flex-col items-center justify-center text-sm font-medium text-neutral-300">
            <div>NEXT</div>
            <div>↓</div>
          </div>
        </ScrollButton>
      </div>

      <section className="min-h-[700px] h-screen bg-neutral-900/10 2xl:flex justify-center items-center backdrop-blur-xs border-y-[1px] border-neutral-500 py-16">
        <div className="flex flex-col w-full 2xl:max-w-[1500px] gap-10 h-full justify-center items-stretch ">
          <div className="flex items-end justify-between px-4 sm:px-24 xl:px-48">
            <SectionHeader title="Projects" subtitle="制作実績" />
            <PrimaryButton href="/projects">すべて見る</PrimaryButton>
          </div>
          <div className="px-4 sm:px-24 xl:px-48">
            <ProjectsCarouselClient />
          </div>
        </div>
        <ScrollButton className="absolute bottom-6 left-1/2 -translate-x-1/2">
          <div className="flex flex-col items-center justify-center text-sm font-medium text-neutral-300">
            <div>NEXT</div>
            <div>↓</div>
          </div>
        </ScrollButton>
      </section>

      <section className="min-h-[1000px] md:min-h-[800px] w-full h-screen justify-center items-center bg-neutral-900/50">
        <div className="flex flex-col gap-10 h-full justify-center items-center w-full ">
          <div className="flex items-center justify-between px-4 sm:px-12 xl:px-48 2xl:max-w-[1500px] w-full">
            <SectionHeader title="Profile" subtitle="私について" />
            <PrimaryButton href="/profile">詳しく見る</PrimaryButton>
          </div>
          <div className="w-full flex flex-col gap-4 md:flex-row items-start justify-between px-4 sm:px-12 xl:px-48 2xl:max-w-[1500px]">
            <ProfileCard />
            <div className="w-full px-2 md:px-12 text-md flex flex-col gap-2 items-start text-neutral-300 tracking-wider">
              <ProfileTabs />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export const metadata: Metadata = {
  title: 'HOME - N.Motoki Portfolio 3.0',
  description:
    'NAKATSUJI Motoki のポートフォリオサイト。UIデザインとフロントエンド開発を紹介します。',
};
