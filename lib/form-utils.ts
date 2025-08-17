// Googleフォームの構造から質問IDを取得するユーティリティ

export const extractQuestionIds = (formStructure: any) => {
  const questionIds: { [key: string]: string } = {};

  if (formStructure.items) {
    formStructure.items.forEach((item: any) => {
      if (item.questionItem) {
        const question = item.questionItem.question;
        const questionId = question.questionId;

        // 質問のタイトルから適切なキーを決定
        const title = question.title?.toLowerCase() || '';

        if (title.includes('名前') || title.includes('name')) {
          questionIds.name = questionId;
        } else if (title.includes('メール') || title.includes('email')) {
          questionIds.email = questionId;
        } else if (title.includes('件名') || title.includes('subject')) {
          questionIds.subject = questionId;
        } else if (title.includes('メッセージ') || title.includes('message')) {
          questionIds.message = questionId;
        }
      }
    });
  }

  return questionIds;
};

// フォーム構造をコンソールに出力（デバッグ用）
export const debugFormStructure = (formStructure: any) => {
  console.log('=== Google Form Structure ===');
  console.log('Form ID:', formStructure.formId);
  console.log('Form Title:', formStructure.info?.documentTitle);

  if (formStructure.items) {
    console.log('\n=== Questions ===');
    formStructure.items.forEach((item: any, index: number) => {
      if (item.questionItem) {
        const question = item.questionItem.question;
        console.log(`${index + 1}. Question ID: ${question.questionId}`);
        console.log(`   Title: ${question.title}`);
        console.log(`   Type: ${question.questionType}`);
        console.log('---');
      }
    });
  }
};
