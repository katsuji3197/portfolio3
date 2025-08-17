// Googleフォームの構造から質問IDを取得するユーティリティ

export const extractQuestionIds = (formStructure: unknown) => {
  const questionIds: { [key: string]: string } = {};

  if (
    formStructure &&
    typeof formStructure === 'object' &&
    'items' in formStructure
  ) {
    (formStructure as { items: unknown[] }).items.forEach((item: unknown) => {
      if (item && typeof item === 'object' && 'questionItem' in item) {
        const questionItem = (
          item as {
            questionItem: { question: { questionId: string; title?: string } };
          }
        ).questionItem;
        const question = questionItem.question;
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
export const debugFormStructure = (formStructure: unknown) => {
  console.log('=== Google Form Structure ===');

  if (formStructure && typeof formStructure === 'object') {
    const structure = formStructure as {
      formId?: string;
      info?: { documentTitle?: string };
      items?: unknown[];
    };
    console.log('Form ID:', structure.formId);
    console.log('Form Title:', structure.info?.documentTitle);

    if (structure.items) {
      console.log('\n=== Questions ===');
      structure.items.forEach((item: unknown, index: number) => {
        if (item && typeof item === 'object' && 'questionItem' in item) {
          const questionItem = (
            item as {
              questionItem: {
                question: {
                  questionId: string;
                  title?: string;
                  questionType?: string;
                };
              };
            }
          ).questionItem;
          const question = questionItem.question;
          console.log(`${index + 1}. Question ID: ${question.questionId}`);
          console.log(`   Title: ${question.title}`);
          console.log(`   Type: ${question.questionType}`);
          console.log('---');
        }
      });
    }
  }
};
