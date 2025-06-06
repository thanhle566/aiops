import { Fragment, useEffect, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import {
  Text,
  Button,
  TextInput,
  MultiSelect,
  MultiSelectItem,
  Callout,
} from "@tremor/react";
import { IoMdClose } from "react-icons/io";
import {
  useForm,
  Controller,
  SubmitHandler,
  FieldValues,
} from "react-hook-form";
import { useRoles } from "utils/hooks/useRoles";
import { useUsers } from "@/entities/users/model/useUsers";
import "./multiselect.css";
import { useApi } from "@/shared/lib/hooks/useApi";
import { KeepApiError } from "@/shared/api";

interface GroupSidebarProps {
  isOpen: boolean;
  toggle: VoidFunction;
  group: any;
  isNewGroup: boolean;
  mutateGroups: (data?: any, shouldRevalidate?: boolean) => Promise<any>;
}

const GroupsSidebar = ({
  isOpen,
  toggle,
  group,
  isNewGroup,
  mutateGroups,
}: GroupSidebarProps) => {
  const {
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isDirty },
    clearErrors,
    setError,
  } = useForm({
    defaultValues: {
      name: "",
      members: [],
      roles: [],
    },
  });

  const { data: roles = [] } = useRoles();
  const { data: users = [], mutate: mutateUsers } = useUsers();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const api = useApi();

  useEffect(() => {
    if (isOpen) {
      if (group) {
        setValue("name", group.name);
        setValue("members", group.members || []);
        setValue("roles", group.roles || []);
      } else {
        reset({
          name: "",
          members: [],
          roles: [],
        });
      }
      clearErrors();
    }
  }, [group, setValue, isOpen, reset, clearErrors]);

  const onSubmit: SubmitHandler<FieldValues> = async (data) => {
    setIsSubmitting(true);
    clearErrors(); // Clear all errors

    try {
      const response = isNewGroup
        ? await api.post("/auth/groups", data)
        : await api.put(`/auth/groups/${group.id}`, data);

      await mutateGroups();
      await mutateUsers();
      handleClose();
    } catch (error) {
      if (error instanceof KeepApiError) {
        setError("root.serverError", {
          message: error.message || "Failed to save group",
        });
      } else {
        setError("root.serverError", {
          message: "An unexpected error occurred",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitClick = (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();
    handleSubmit(onSubmit)();
  };

  const handleClose = () => {
    setIsSubmitting(false);
    clearErrors("root.serverError");
    reset();
    toggle();
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        </Transition.Child>
        <Transition.Child
          as={Fragment}
          enter="transition ease-in-out duration-300 transform"
          enterFrom="translate-x-full"
          enterTo="translate-x-0"
          leave="transition ease-in-out duration-300 transform"
          leaveFrom="translate-x-0"
          leaveTo="translate-x-full"
        >
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Dialog.Panel className="w-full max-w-3xl max-h-[90vh] bg-white shadow-xl overflow-auto">
              <div className="flex justify-between mb-4">
                <Dialog.Title className="text-3xl font-bold" as={Text}>
                  {isNewGroup ? "Create Group" : "Group Details"}
                </Dialog.Title>
                <Button onClick={handleClose} variant="light">
                  <IoMdClose className="h-6 w-6 text-gray-500" />
                </Button>
              </div>
              <form
                onSubmit={handleSubmitClick}
                className="mt-4 flex flex-col h-full"
              >
                <div className="flex-grow">
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700">
                      Group Name
                    </label>
                    <Controller
                      name="name"
                      control={control}
                      rules={{ required: "Group name is required" }}
                      render={({ field }) => (
                        <TextInput
                          {...field}
                          error={!!errors.name}
                          errorMessage={errors.name?.message}
                          disabled={!isNewGroup}
                          className={`${isNewGroup ? "" : "bg-gray-200"}`}
                        />
                      )}
                    />
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700">
                      Members
                    </label>
                    <Controller
                      name="members"
                      control={control}
                      render={({ field }) => (
                        <MultiSelect
                          {...field}
                          onValueChange={(value) => field.onChange(value)}
                          value={field.value as string[]}
                          className="custom-multiselect !max-w-none"
                        >
                          {users.map((user) => (
                            <MultiSelectItem key={user.email} value={user.email}>
                              {user.email}
                            </MultiSelectItem>
                          ))}
                        </MultiSelect>
                      )}
                    />
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700">
                      Roles
                    </label>
                    <Controller
                      name="roles"
                      control={control}
                      render={({ field }) => (
                        <MultiSelect
                          {...field}
                          onValueChange={(value) => field.onChange(value)}
                          value={field.value as string[]}
                          className="custom-multiselect !max-w-none"
                        >
                          {roles.map((role) => (
                            <MultiSelectItem key={role.id} value={role.name}>
                              {role.name}
                            </MultiSelectItem>
                          ))}
                        </MultiSelect>
                      )}
                    />
                  </div>
                </div>
                {errors.root?.serverError && (
                  <Callout
                    className="mt-4"
                    title="Error while saving group"
                    color="rose"
                  >
                    {errors.root.serverError.message}
                  </Callout>
                )}
                <div className="mt-6 flex justify-end gap-2">
                  <Button
                    variant="secondary"
                    onClick={(e) => {
                      e.preventDefault();
                      handleClose();
                    }}
                    className="btn-secondary border border-[#2C4A4B] text-[#2C4A4B]"
                  >
                    Cancel
                  </Button>
                  <Button
                    className="btn-primary"
                    type="submit"
                    disabled={isSubmitting || (isNewGroup ? false : !isDirty)}
                  >
                    {isSubmitting
                      ? "Saving..."
                      : isNewGroup
                        ? "Create Group"
                        : "Save"}
                  </Button>
                </div>
              </form>
            </Dialog.Panel>
          </div>
        </Transition.Child>
      </Dialog>
    </Transition>
  );
};

export default GroupsSidebar;
