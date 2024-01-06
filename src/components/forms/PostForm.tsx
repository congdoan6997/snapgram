import { Models } from "appwrite";
import { useNavigate } from "react-router-dom";
import { useToast } from "../ui/use-toast";
import { useUserContext } from "@/context/AuthContext";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { PostValidation } from "@/lib/validation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCreatePost, useUpdatePost } from "@/lib/react-query/queries";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Textarea } from "../ui/textarea";
import FileUploader from "../shared/FileUploader";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import Loader from "../shared/Loader";

type PostFormProps = {
  action: "Create" | "Update";
  post?: Models.Document;
};

const PostForm = ({ action, post }: PostFormProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useUserContext();
  const form = useForm<z.infer<typeof PostValidation>>({
    resolver: zodResolver(PostValidation),
    defaultValues: {
      caption: post ? post?.caption : "",
      location: post ? post?.location : "",
      file: [],
      tags: post ? post?.tags.join(",") : "",
    },
  });

  // Query
  const { mutateAsync: createPost, isPending: isLoadingCreate } =
    useCreatePost();
  const { mutateAsync: updatePost, isPending: isLoadingUpdate } =
    useUpdatePost();

  const onSubmit = async (value: z.infer<typeof PostValidation>) => {
    //action create
    if (action === "Create") {
      const newPost = await createPost({
        ...value,
        userId: user.id,
      });

      if (!newPost) {
        toast({
          title: "Error",
          description: "Something went wrong",
          variant: "destructive",
        });
        return;
      }

      navigate("/");
    }

    //action update
    if (post && action === "Update") {
      // console.log(value)
      const updatedPost = await updatePost({
        ...value,
        postId: post?.$id,
        imageId: post?.imageId,
        imageUrl: post?.imageUrl,
      });
      if (!updatedPost) {
        toast({
          title: "Error",
          description: "Something went wrong",
          variant: "destructive",
        });
        return;
      }
      navigate(`/posts/${post?.$id}`);
    }

    // TODO: update post
  };
  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-9 w-full  max-w-5xl"
      >
        <FormField
          control={form.control}
          name="caption"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="shad-form_label">Caption</FormLabel>
              <FormControl>
                <Textarea
                  className="shad-textarea custom-scrollbar"
                  {...field}
                />
              </FormControl>
              <FormMessage className="shad-form_message" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="file"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="shad-form_label">Add Photos</FormLabel>
              <FormControl>
                <FileUploader
                  fieldChange={field.onChange}
                  mediaUrl={post?.imageUrl}
                />
              </FormControl>
              <FormMessage className="shad-form_message" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="shad-form_label">Add Location</FormLabel>
              <FormControl>
                <Input type="text" className="shad-input" {...field} />
              </FormControl>
              <FormMessage className="shad-form_message" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="tags"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="shad-form_label">
                Add Tags (separated by comma " , ")
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="Art, Expression, Learn"
                  type="text"
                  className="shad-input"
                  {...field}
                />
              </FormControl>
              <FormMessage className="shad-form_message" />
            </FormItem>
          )}
        />

        <div className="flex gap-4 items-center justify-end">
          <Button
            type="button"
            className="shad-button_dark_4"
            onClick={() => navigate(-1)}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="shad-button_primary whitespace-nowrap"
            disabled={isLoadingCreate || isLoadingUpdate}
          >
            {(isLoadingCreate || isLoadingUpdate) && <Loader />}
            {action} Post
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default PostForm;
