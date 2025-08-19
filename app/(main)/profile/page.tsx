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
              <h2 className="text-2xl font-bold">✏️Work in Progress</h2>
              <p className="text-sm text-neutral-400 font-medium tracking-wider">
                (Profile)
              </p>
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
