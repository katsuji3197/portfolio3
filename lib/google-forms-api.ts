import { google } from 'googleapis';

// Google Forms APIクライアントの初期化
const getGoogleFormsClient = () => {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: [
      'https://www.googleapis.com/auth/forms.body',
      'https://www.googleapis.com/auth/forms.responses',
    ],
  });

  return google.forms({ version: 'v1', auth });
};

// フォームの構造を取得
export const getFormStructure = async (formId: string) => {
  try {
    const forms = getGoogleFormsClient();
    const response = await forms.forms.get({ formId });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// フォームに回答を送信 (HTTP POSTを使用)
export const submitFormResponse = async (
  formId: string,
  answers: Record<string, string | string[]>
) => {
  try {
    const formUrl = `https://docs.google.com/forms/u/0/d/e/${formId}/formResponse`;

    const formData = new FormData();
    Object.entries(answers).forEach(([questionId, value]) => {
      if (Array.isArray(value)) {
        value.forEach(v => formData.append(questionId, v));
      } else {
        formData.append(questionId, value);
      }
    });

    await fetch(formUrl, {
      method: 'POST',
      body: formData,
      mode: 'no-cors',
    });

    return { success: true };
  } catch (error) {
    throw error;
  }
};

// フォームの回答を取得
export const getFormResponses = async (formId: string) => {
  try {
    const forms = getGoogleFormsClient();
    const response = await forms.forms.responses.list({ formId });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// 回答データの形式を変換
export const formatAnswer = (questionId: string, value: string | string[]) => {
  return {
    questionId,
    textAnswers: {
      answers: Array.isArray(value)
        ? value.map(v => ({ value: v }))
        : [{ value }],
    },
  };
};
