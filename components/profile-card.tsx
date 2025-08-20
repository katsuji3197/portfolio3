import Image from 'next/image';

export default function ProfileCard() {
  return (
    <div className="flex items-center md:flex-col justify-center w-full md:w-72 p-3 md:px-4 md:py-4 bg-neutral-900/10 backdrop-blur-xs border-[1px] border-neutral-700 rounded-lg mt-0 md:mt-12">
      <Image
        src="/img/katsuji-fish.jpg"
        alt="profile"
        width={1000}
        height={1000}
        quality={80}
        priority
        className="md:max-w-none w-36 h-auto md:w-full md:h-full object-cover rounded-lg m-3 opacity-80 shadow-2xl"
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
              金沢工業大学 <br className="md:hidden" /> 情報フロンティア学部
              <br /> メディア情報学科 4年
            </ul>
          </li>
        </ul>
      </div>
    </div>
  );
}
