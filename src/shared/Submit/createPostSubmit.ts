import { createPost, updatePost } from '../api/postsApi';

export type ExistingFileDescriptor = {
  url: string;
};

export type SelectedFile = File | ExistingFileDescriptor;

export interface CreatePostSubmitParams {
  text: string;
  files: SelectedFile[];
  attachments?: File[]; 
  communityId?: number | null;
}

export async function processCreatePostData({
  text,
  files,
  attachments = [],
  communityId,
}: CreatePostSubmitParams): Promise<void> {
  const formData = new FormData();
  formData.append('text', text);

  for (const file of files) {
    if (file instanceof File) {
      formData.append('photos', file);
    } else if (file.url) {
      const resp = await fetch(file.url);
      const blob = await resp.blob();
      const name = file.url.split('/').pop() ?? 'image.jpg';
      const newFile = new File([blob], name, { type: blob.type });
      formData.append('photos', newFile);
    }
  }

  for (const file of attachments) {
    formData.append('attachments', file);
    console.log(file);
  }

  if (communityId) {
    formData.append('communityID', String(communityId));
  }

  await createPost(formData);
  console.log(formData.values.apply);
}

export interface UpdatePostSubmitParams {
  text: string;
  selectedFiles: SelectedFile[];
  communityIdFromPost: number | null;
  postId: number;
  attachments?: File[];
}

export async function processUpdatePostData(params: UpdatePostSubmitParams): Promise<void> {
  const { text, selectedFiles, attachments, communityIdFromPost, postId } = params;

  const formData = new FormData();
  formData.append('text', text);

  for (const file of selectedFiles) {
    if (file instanceof File) {
      formData.append('photos', file);
    } else if (file.url) {
      const resp = await fetch(file.url);
      const blob = await resp.blob();
      const name = file.url.split('/').pop() ?? 'image.jpg';
      const newFile = new File([blob], name, { type: blob.type });
      formData.append('photos', newFile);
    }
  }

  if (attachments) {
    for (const file of attachments) {
      formData.append('attachments', file);
      console.log(file);
    }
  } else {
    formData.append('attachments', '');
  }

  if (communityIdFromPost) {
    formData.append('communityID', String(communityIdFromPost));
  }

  await updatePost(postId, formData);
}

