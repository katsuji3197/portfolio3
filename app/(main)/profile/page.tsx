import type { Metadata } from 'next';
import ProfileTabs from '@/components/profile-tabs';
import Image from 'next/image';

export default function Profile() {
  return (
    <div className="text-neutral-100">
      <section className="min-h-[1000px] md:min-h-[800px] w-full h-screen justify-center items-center">
        <div className="flex flex-col gap-10 h-full justify-center items-center w-full ">
          <div className="flex items-center justify-between px-4 sm:px-12 xl:px-48 2xl:max-w-[1500px] w-full">
            <div className="flex items-end gap-2">
              <h2 className="text-2xl font-bold">Profile</h2>
              <p className="text-sm text-neutral-400 font-medium tracking-wider">
                私について
              </p>
            </div>
          </div>
          <div className="w-full flex flex-col gap-4 md:flex-row items-start justify-between px-4 sm:px-12 xl:px-48 2xl:max-w-[1500px]">
            <div className="flex items-center md:flex-col justify-start w-full md:w-fit p-2 md:px-4 md:py-0 md:pb-3 bg-neutral-900/10 backdrop-blur-xs border-[1px] border-neutral-700 rounded-lg mt-0 md:mt-12">
              <Image
                src="/img/katsuji-fish.jpg"
                alt="profile"
                width={1000}
                height={1000}
                className="max-w-[20vh] md:max-w-none w-36 h-auto md:w-full md:h-full object-cover rounded-lg m-3 opacity-80 shadow-2xl"
              />
              <div className="flex flex-col gap-2 w-full md:min-w-64">
                <div className="flex flex-col pt-1">
                  <h2 className="text-xl font-medium text-neutral-200 tracking-wider">
                    中辻 基希
                  </h2>
                  <p className="text-sm text-neutral-400 font-medium tracking-wider">
                    NAKATSUJI Motoki
                  </p>
                </div>
                <p className="text-xs md:text-md text-neutral-500 font-medium">
                  UI Designer / <br className="md:hidden" /> Frontend Developer
                </p>
                <div className="h-[1px] w-full pr-2 bg-neutral-700" />
                <ul className="flex flex-col gap-2">
                  <li className="flex flex-col gap-2 text-neutral-400 text-xs md:text-sm">
                    <ul>
                      金沢工業大学 <br className="md:hidden" />{' '}
                      情報フロンティア学部
                      <br /> メディア情報学科 4年
                    </ul>
                  </li>
                </ul>
              </div>
            </div>
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
  title: 'Profile — N.Motoki',
  description: '中辻基希（NAKATSUJI Motoki）の経歴・スキル・活動について。',
};
