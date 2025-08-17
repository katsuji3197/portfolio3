import GoogleFormsAPIContactForm from '@/components/google-forms-api-contact-form';
import Accordion from '@/components/accordion';
import Image from 'next/image';
import Link from 'next/link';

// SNSリンクのデータ配列
const socialLinks = [
  {
    id: 'x',
    name: 'X (旧Twitter)',
    handle: '@iamkatsuji',
    url: 'https://x.com/iamkatsuji',
    icon: '/icons/x.svg',
    alt: 'X (Twitter)',
  },

  {
    id: 'mail',
    name: 'Mail',
    handle: 'Katsuji@paon.dev',
    url: 'mailto:Katsuji@paon.dev',
    icon: '/icons/mail.svg',
    alt: 'Mail',
  },
  {
    id: 'instagram',
    name: 'Instagram',
    handle: '@iamkatsuj1',
    url: 'https://www.instagram.com/iamkatsuj1/',
    icon: '/icons/instagram.svg',
    alt: 'Instagram',
  },
  {
    id: 'discord',
    name: 'Discord',
    handle: 'Katsuji503',
    url: 'https://discord.com/users/624136035588112394',
    icon: '/icons/discord.svg',
    alt: 'Discord',
  },
  {
    id: 'github',
    name: 'GitHub',
    handle: '@katsuji3197',
    url: 'https://github.com/iamkatsuji',
    icon: '/icons/github.svg',
    alt: 'GitHub',
  },
];

export default function Contact() {
  return (
    <div className="text-neutral-100">
      <section className="min-h-[1000px] md:min-h-[800px] w-full h-screen justify-center items-center">
        <div className="flex flex-col lg:flex-row items-center justify-center h-full py-4 px-4 md:px-24 w-full">
          <div className="w-full mb-8 flex gap-2 items-end justify-start text-start lg:w-72">
            <h1 className="text-2xl font-bold ">Contact</h1>
            <p className="text-sm text-neutral-400">お問い合わせ</p>
          </div>

          {/* SNSリンクをmapで描画 */}
          <div className="w-full lg:w-96 flex flex-col gap-4">
            {socialLinks.map(social => (
              <Link
                key={social.id}
                className="flex gap-6 items-center border border-neutral-700 bg-neutral-900/10 backdrop-blur-xs rounded-lg p-4 w-full lg:w-96 hover:bg-neutral-800/50 transition-colors duration-200"
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Image
                  src={social.icon}
                  alt={social.alt}
                  width={32}
                  height={32}
                  className="opacity-40"
                />
                <div className="flex flex-col gap-1">
                  <h2 className="text-lg font-medium text-neutral-300">
                    {social.name}
                  </h2>
                  <p className="text-sm text-neutral-400">{social.handle}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
      {/* 画面下部に固定されたアコーディオンでお問い合わせフォームを表示 */}
      <Accordion
        title="フォームから問い合わせる"
        defaultOpen={false}
        isFixed={true}
      >
        <div className="py-12">
          <GoogleFormsAPIContactForm />
        </div>
      </Accordion>
    </div>
  );
}
